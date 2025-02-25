import { useSignAndExecuteTransaction } from "@mysten/dapp-kit";
import { SuiPriceServiceConnection, SuiPythClient } from "@pythnetwork/pyth-sui-js";
import { Transaction } from "@mysten/sui/transactions";
import { SuiClient, getFullnodeUrl } from "@mysten/sui/client";
import { useState } from "react";

interface PriceUpdateComponentProps {
  onClose: () => void;
  onSuccess: () => void;
}

const PriceUpdateComponent: React.FC<PriceUpdateComponentProps> = ({ onClose, onSuccess }) => {
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();
  const suiClient = new SuiClient({ url: getFullnodeUrl("testnet") });
  const connection = new SuiPriceServiceConnection("https://hermes-beta.pyth.network");

  const priceIDs = [
    "0x50c67b3fd225db8912a424dd4baed60ffdde625ed2feaaf283724f9608fea266", // SUI/USD price ID
  ];

  const wormholeStateId = "0x31358d198147da50db32eda2562951d53973a0c0ad5ed738e9b17d88b213d790";
  const pythStateId = "0x243759059f4c3111179da5878c12f68d612c21a8d54d85edc86164bb18be1c7c";
  const client = new SuiPythClient(suiClient, pythStateId, wormholeStateId);

  // 用于保存从事件中提取的 price 和 timestamp
  const [timestamp, setTimestamp] = useState<string>("");
  const [formattedPrice, setFormattedPrice] = useState<string>("");
  const [isTransactionSuccessful, setIsTransactionSuccessful] = useState<boolean>(false);

  // 处理价格更新并创建交易
  const create = async () => {
    try {
      // 获取价格更新数据
      const priceUpdateData = await connection.getPriceFeedsUpdateData(priceIDs);

      // 创建交易
      const tx = new Transaction();

      // 更新价格并获取 PriceInfoObject ID
      const priceInfoObjectIds = await client.updatePriceFeeds(tx, priceUpdateData, priceIDs);

      console.log(priceInfoObjectIds);

      // 调用合约方法
      tx.moveCall({
        target: `0xed9ee911031ed3a21ed4f250db119ef91c9712d5e92e7deb8112fcffc12bef58::main::use_pyth_price`,
        arguments: [
          tx.object("0x6"), // 传入 Clock 对象
          tx.object(priceInfoObjectIds[0]), // 传入 PriceInfoObject ID
        ],
      });

      // 执行交易
      const result = await signAndExecute({ transaction: tx });
      const eventsResult = await suiClient.queryEvents({
        query: { Transaction: result.digest },
      });

      if (eventsResult.data.length > 0) {
        const firstEvent = eventsResult.data[0]?.parsedJson as any;

        const decimal = firstEvent?.decimal?.magnitude || "No events found for the given criteria.";
        const price = firstEvent?.price?.magnitude || "No events found for the given criteria.";
        const timestamp = firstEvent?.timestamp || "No events found for the given criteria.";

        // 格式化 price
        const formattedPriceValue = formatPriceWithDecimal(price, decimal);

        // 转换时间戳
        const formattedTimestamp = convertTimestampToDate(timestamp);

        // 更新状态
        setFormattedPrice(formattedPriceValue);
        setTimestamp(formattedTimestamp);
        setIsTransactionSuccessful(true);

        // 调用成功的回调
        onSuccess();
      } else {
        setIsTransactionSuccessful(false);
        onSuccess();
      }
    } catch (error) {
      console.error("Error executing transaction:", error);
      setIsTransactionSuccessful(false);
    }
  };

  // 格式化价格的函数
  const formatPriceWithDecimal = (price: string, decimal: string) => {
    const decimalValue = parseInt(decimal, 10);
    const priceValue = parseFloat(price);

    // 根据 decimal 精度格式化 price
    const formattedPrice = priceValue / Math.pow(10, decimalValue);

    // 返回格式化后的价格值
    return formattedPrice.toFixed(decimalValue);
  };

  // 将时间戳转换为日期
  const convertTimestampToDate = (timestamp: string) => {
    const timestampInSeconds = parseInt(timestamp, 10);
    const date = new Date(timestampInSeconds * 1000); // 转换为毫秒
    return date.toLocaleString(); // 格式化为本地日期时间格式
  };

  return (
    <div>
      <button onClick={() => create()}>Update Price</button>
      <button onClick={onClose}>Close</button>

      {isTransactionSuccessful && (
        <div>
          <p>Formatted Price: {formattedPrice} USD</p>
          <p>Timestamp: {timestamp}</p>
        </div>
      )}
    </div>
  );
};

export default PriceUpdateComponent;
