export const enum EWebRuleType {
  /** redirect url */
  REDIRECT = 'REDIRECT',
  /** enforece https connection */
  HSTS = 'HSTS',
  /** block url */
  BLOCK = 'BLOCK',
  /** alter header */
  HEADER = 'HEADER',
  /** Referrer & UA actually belong to  header*/
  /** change referrer */
  REFERRER = 'REFERER',
  /** change user-agent */
  UA = 'UA',
  /** allow cross origin request */
  CORS = 'CORS',
  /** log webrequest */
  LOG = 'LOG'
}

/** custom url redirect rule */
export interface IRedirectRule {
  cmd: EWebRuleType.REDIRECT

  /** redirect to url pattern */
  redirectUrl: string
  /** reg string can match the source url */
  reg: string
  /**
   * false for no wildcard param
   * string for wildcard reg string
   */
  wildcard: false | string
  /**
   * false for no params
   * array for exist params in path
   */
  params: false | string[]
  /**
   * false for no querystring params
   * object for exist param in querystring
   */
  qsParams: false | { [k: string]: string }
}

/** redirect enforece https connect  */
export interface IHstsRule {
  cmd: EWebRuleType.HSTS
}

/** block connect */
export interface IBlockRule {
  cmd: EWebRuleType.BLOCK
}

/** no referer  */
export interface IReferrerRule {
  cmd: EWebRuleType.REFERRER
  /**
   * out: for remove referrer from the url
   * in: for remove referrer to the url
   * */
  type: 'out' | 'in'
}

/** remove exist header(can use in hotlink) */
export interface IDeleteHeaderRule {
  cmd: EWebRuleType.HEADER
  type: 'delete'
  /** header name to delete */
  name: string
}

/** change exist header(set a new header if not exist) */
export interface IUpdateHeaderRule {
  cmd: EWebRuleType.HEADER
  type: 'update'
  /** header name that value need be changed */
  name: string
  /** dest value */
  val: string
}

export type IAlterHeaderRule = IDeleteHeaderRule | IUpdateHeaderRule

/** allow cors request */
export interface ICorsRule {
  cmd: EWebRuleType.CORS
  /**
   * out: for allow cors from the url
   * in: for allow cors to the url
   * */
  type: 'out' | 'in'
}

/** change ua  */
export interface IUaRule {
  cmd: EWebRuleType.UA
  /**
   * out: for change ua of all requests from the url
   * in: for change ua of all requests to the url
   * */
  type: 'out' | 'in'
  /** ua want to change */
  ua: string
}

/** log the request info to the url */
export interface ILogRule {
  cmd: EWebRuleType.LOG
}

export type IWebRule =
  ILogRule |
  ICorsRule |
  IAlterHeaderRule |
  IBlockRule |
  IHstsRule |
  IRedirectRule |
  IReferrerRule |
  IUaRule


export interface IRuleConfig {
  /** rule id, auto-generated */
  id: string
  rules: IWebRule[]
  /** chrome match url pattern */
  url: string
  /** if true matchUrl should be a valid reg string */
  useReg: false
  /** url input match pattern */
  matchUrl: string
  enabled: boolean
  isValid: boolean
  createdAt: number
  updatedAt: number
}

export interface IUaInfo {
  ua: string
}