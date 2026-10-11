#!/bin/sh
# Builds libsword and sword_wasm.cpp into src/sword/sword.js and sword.wasm,
# which are committed, so only run this after changing the wrapper or the
# SWORD version. Needs Docker; everything else comes in the Emscripten image.
#
# One WebAssembly build runs on every OS and CPU VS Code does. libsword is
# built with zlib only: no ICU, curl, CLucene, bzip2 or xz.
set -e
cd "$(dirname "$0")"

SWORD_VERSION=1.9.0
EMSDK_IMAGE=emscripten/emsdk:4.0.10

mkdir -p .build
cd .build
if [ ! -d "sword-$SWORD_VERSION" ]; then
	curl -sSfL "https://crosswire.org/ftpmirror/pub/sword/source/v1.9/sword-$SWORD_VERSION.tar.gz" | tar xz
fi
cp ../sword_wasm.cpp .

docker run --rm -u "$(id -u):$(id -g)" -v "$PWD:/src" -w /src "$EMSDK_IMAGE" sh -c "
set -e
emcmake cmake -S sword-$SWORD_VERSION -B build -DCMAKE_BUILD_TYPE=Release -DLIBSWORD_LIBRARY_TYPE=Static \
	-DSWORD_NO_ICU=Yes -DSWORD_NO_CURL=Yes -DSWORD_NO_CLUCENE=Yes -DSWORD_NO_BZIP2=Yes -DSWORD_NO_XZ=Yes \
	-DSWORD_USE_INTERNAL_ZLIB=Yes -DSWORD_BUILD_UTILS=No -DSWORD_BUILD_EXAMPLES=No -DSWORD_BUILD_TESTS=No
cmake --build build -j\$(nproc) --target sword_static
em++ -O2 -std=c++17 -Isword-$SWORD_VERSION/include -Ibuild sword_wasm.cpp build/libsword.a -o sword.js \
	-sMODULARIZE=1 -sEXPORT_NAME=createSword -sENVIRONMENT=node -sALLOW_MEMORY_GROWTH=1 -lnodefs.js \
	-sEXPORTED_RUNTIME_METHODS=FS,NODEFS,cwrap \
	-sEXPORTED_FUNCTIONS=_sw_open,_sw_modules,_sw_passage,_sw_set_cipher_key
"

cp sword.js sword.wasm ../../src/sword/
echo "Built src/sword/sword.js and src/sword/sword.wasm"
