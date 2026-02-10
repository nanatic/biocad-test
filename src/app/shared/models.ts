export type AssetStatus = 'free' | 'busy';
export type DeviceType = 'box' | 'osmometr' | 'recirculation' | 'unknown';

export type User = {
  id: number;
  login: string;
  displayName: string;
  avatarUrl?: string | null;
};

export type AssetDescription = {
  erpGuid: string;
  serialNumber: string;
  passportId: string;
  className: string;
  manufacturer: string;
};

export type Asset = {
  id: string;
  type: DeviceType;
  name: string;
  room: string;
  status: AssetStatus;
  isMine: boolean;
  busyBy?: User | null;
  description?: AssetDescription;
  counts: { warnings: number; alarms: number };
};

export type AssetEvent = {
  id: number;
  assetId: string | number;
  ts: string;
  type: string;
  result: string;
  userLogin: string; 
};
