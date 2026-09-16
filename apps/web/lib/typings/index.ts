export interface ISiteConfig {
  title: string;
  logoRatio: string;
  logoMaxWidth: number;
  logoSrc?: string;
  networkPath: string;
  redirect: string;
  loginPath: string;
  signupPath: string;
}

export interface IAnalyticsObject {
  action: string;
  amcnId: string;
  clickthroughUrl: string;
  contentEpisode: number;
  contentNetworkOfRecordId: number;
  contentSeason: number;
  contentShow: string;
  contentTitle: boolean;
  elementName: string;
  elementType: string;
  itemText: string;
  nid: number;
}
