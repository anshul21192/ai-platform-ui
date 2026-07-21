import SendIcon from "@mui/icons-material/Send";
import PaymentForm, { type PaymentFormConfig } from "../components/PaymentForm";

const config: PaymentFormConfig = {
  title: "Send Money",
  subtitle: "Transfer money to anyone instantly",
  actionIcon: <SendIcon sx={{ fontSize: 16 }} />,
  actionLabel: "Send Money",
  nameFieldLabel: "Recipient Name",
  nameFieldPlaceholder: "Enter recipient name",
  summaryTitle: "Transaction Summary",
  amountLabel: "Transfer Amount",
  feeLabel: "Transaction Fee",
  infoBoxTitle: "Instant Transfer:",
  infoBoxDescription: "Your payment will be processed immediately.",
  submitAction: "TRANSFER",
};

export default function SendMoneyPage() {
  return <PaymentForm config={config} />;
}
