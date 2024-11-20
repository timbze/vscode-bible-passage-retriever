type BcvObject = {
  osis: () => string
}

type BcvParserType = {
  parse: (text: string) => BcvObject
  new(): BcvParserType
}

type BcvModule = {
  bcv_parser?: BcvParserType
}

declare module 'en_bcv_parser' {
  export const bcvParser: BcvParserType
}
