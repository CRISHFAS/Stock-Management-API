export interface MercadoLibreToken {
  id: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
  mlUserId: string;
  userId: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastRefreshAt?: Date;
  scopes?: string[];
}

export interface MLAuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
  user_id: number;
  refresh_token: string;
}

export interface MLUserInfo {
  id: number;
  nickname: string;
  email: string;
  first_name: string;
  last_name: string;
  country_id: string;
  user_type: string;
  tags: string[];
  logo?: string;
  points: number;
  site_id: string;
  permalink: string;
}

export interface MLProduct {
  id: string;
  title: string;
  price: number;
  base_price: number;
  original_price?: number;
  currency_id: string;
  available_quantity: number;
  sold_quantity: number;
  buying_mode: string;
  listing_type_id: string;
  condition: string;
  permalink: string;
  thumbnail: string;
  pictures: MLPicture[];
  status: string;
  sub_status: string[];
  tags: string[];
  category_id: string;
  attributes: MLAttribute[];
  variations: MLVariation[];
  shipping: MLShipping;
  seller_address: MLAddress;
  start_time: string;
  stop_time?: string;
  last_updated: string;
}

export interface MLPicture {
  id: string;
  url: string;
  secure_url: string;
  size: string;
  max_size: string;
}

export interface MLAttribute {
  id: string;
  name: string;
  value_id?: string;
  value_name?: string;
  value_struct?: any;
}

export interface MLVariation {
  id: number;
  price: number;
  attribute_combinations: MLAttribute[];
  available_quantity: number;
  sold_quantity: number;
  picture_ids: string[];
}

export interface MLShipping {
  mode: string;
  methods: any[];
  tags: string[];
  dimensions?: string;
  local_pick_up?: boolean;
  free_shipping?: boolean;
  logistic_type?: string;
}

export interface MLAddress {
  id: string;
  address_line: string;
  street_name?: string;
  street_number?: string;
  comment?: string;
  zip_code?: string;
  city: MLCity;
  state: MLState;
  country: MLCountry;
  latitude?: number;
  longitude?: number;
}

export interface MLCity {
  id: string;
  name: string;
}

export interface MLState {
  id: string;
  name: string;
}

export interface MLCountry {
  id: string;
  name: string;
}

export interface MLItemUpdate {
  title?: string;
  price?: number;
  available_quantity?: number;
  status?: string;
  pictures?: Array<{ source: string }>;
  attributes?: MLAttribute[];
}

export interface MLSyncResult {
  success: boolean;
  message: string;
  mlProductId?: string;
  localProductId: string;
  action: 'created' | 'updated' | 'synced' | 'error';
  error?: string;
}
