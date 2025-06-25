import { TickerResponse } from '../response/ticker-response';
import { TickerDto } from '../dto/ticker-response.dto';

export function mapTickerDtoToResponse(dto: TickerDto): TickerResponse {
  return {
    symbol: dto.symbol,
    lastPrice: +dto.lastPrice,
    indexPrice: +dto.indexPrice,
    markPrice: +dto.markPrice,
    prevPrice24h: +dto.prevPrice24h,
    price24hPcnt: +dto.price24hPcnt,
    prevPrice1h: +dto.prevPrice1h,
    highPrice24h: +dto.highPrice24h,
    lowPrice24h: +dto.lowPrice24h,
    volume24h: +dto.volume24h,
    turnover24h: +dto.turnover24h,
    openInterest: +dto.openInterest,
    openInterestValue: +dto.openInterestValue,
    fundingRate: +dto.fundingRate,
    nextFundingTime: dto.nextFundingTime,
    bid1Price: +dto.bid1Price,
    bid1Size: +dto.bid1Size,
    ask1Price: +dto.ask1Price,
    ask1Size: +dto.ask1Size,
    predictedDeliveryPrice: +dto.predictedDeliveryPrice,
    basisRate: +dto.basisRate,
    deliveryFeeRate: +dto.deliveryFeeRate,
    deliveryTime: dto.deliveryTime,
    basis: +dto.basis,
    preOpenPrice: +dto.preOpenPrice,
    preQty: +dto.preQty,
    curPreListingPhase: dto.curPreListingPhase,
  };
}
