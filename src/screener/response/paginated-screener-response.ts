import { MultiTimeframeData } from './multi-timeframe-data';

export class PaginatedScreenerResponse {
  data: MultiTimeframeData[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}
