import { useSignAndExecuteTransaction } from "@mysten/dapp-kit";
import { SuiPriceServiceConnection, SuiPythClient } from "@pythnetwork/pyth-sui-js";
import { Transaction } from "@mysten/sui/transactions";
import { SuiClient, getFullnodeUrl } from "@mysten/sui/client";

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
      console.log(result);

      // 调用成功的回调
      onSuccess();
    } catch (error) {
      console.error("Error executing transaction:", error);
    }
  };

  return (
    <div>
      <button onClick={() => create()}>Update Price</button>
      <button onClick={onClose}>Close</button>
    </div>
  );
};

export default PriceUpdateComponent;
