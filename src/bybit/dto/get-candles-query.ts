import {IsNotEmpty, IsString} from "class-validator";


export class GetCandlesQuery {
    @IsString()
    @IsNotEmpty()
    symbol: string;

    @IsString()
    interval: string;
}
