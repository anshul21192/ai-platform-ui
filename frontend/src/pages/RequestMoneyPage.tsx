import RequestQuoteIcon from "@mui/icons-material/RequestQuote";
import PaymentForm, { type PaymentFormConfig } from "../components/PaymentForm";

const config: PaymentFormConfig = {
  title: "Request Money",
  subtitle: "Request payments from anyone",
  actionIcon: <RequestQuoteIcon sx={{ fontSize: 16 }} />,
  actionLabel: "Request Money",
  nameFieldLabel: "Request From",
  nameFieldPlaceholder: "Enter name",
  summaryTitle: "Request Summary",
  amountLabel: "Request Amount",
  feeLabel: "Service Fee",
  infoBoxTitle: "Instant Request:",
  infoBoxDescription: "Your request will be sent immediately.",
  submitAction: "REQUEST_MONEY",
};

export default function RequestMoneyPage() {
  return <PaymentForm config={config} />;
}
