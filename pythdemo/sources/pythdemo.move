/*
/// Module: pythdemo
module pythdemo::pythdemo;
*/

// For Move coding conventions, see
// https://docs.sui.io/concepts/sui-move-concepts/conventions

module pythdemo::main {
    use sui::clock::Clock;
    use sui::event;
    use pyth::price;
    use pyth::pyth;
    use pyth::i64::I64;
    use pyth::price_info::PriceInfoObject;
 
    public struct PriceEvent has copy, drop{
        decimal: I64,
        price: I64,
        timestamp: u64
    }
 
    public fun use_pyth_price(
        clock: &Clock,
        price_info_object: &PriceInfoObject,
        _ctx: &mut TxContext
    ){
        let max_age = 6000000000;
        // Make sure the price is not older than max_age seconds
        let price_struct = pyth::get_price_no_older_than(price_info_object,clock, max_age);
 
        // Extract the price, decimal, and timestamp from the price struct and use them
        let decimal_i64 = price::get_expo(&price_struct);
        let price_i64 = price::get_price(&price_struct);
        let timestamp_sec = price::get_timestamp(&price_struct);
        event::emit(PriceEvent{
            decimal: decimal_i64,
            price: price_i64,
            timestamp: timestamp_sec
        });
    }
}
