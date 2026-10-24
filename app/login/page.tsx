import type { Metadata } from "next";
import { LoginPage } from "../../components/supervisi/pages/LoginPage";

export const metadata: Metadata = {
  title: "Login Administrator | SMART-SUPERVISI",
  description: "Masuk ke sistem supervisi klinis keperawatan RS Semen Gresik",
};

export default function Page() {
  return <LoginPage />;
}
