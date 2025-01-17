import { ConnectButton } from "@mysten/dapp-kit";
import { Box, Container, Flex, Heading } from "@radix-ui/themes";
import PriceUpdateComponent from "./index";

function App() {
  // onClose 和 onSuccess 的实现
  const handleClose = () => {
    console.log("Closed");
  };

  const handleSuccess = () => {
    console.log("Success!");
  };

  return (
    <>
      <Flex
        position="sticky"
        px="4"
        py="2"
        justify="between"
        style={{
          borderBottom: "1px solid var(--gray-a2)",
        }}
      >
        <Box>
          <Heading>dApp Starter Template</Heading>
        </Box>

        <Box>
          <ConnectButton />
        </Box>
      </Flex>
      <Container>
        <PriceUpdateComponent onClose={handleClose} onSuccess={handleSuccess} />
      </Container>
    </>
  );
}

export default App;
