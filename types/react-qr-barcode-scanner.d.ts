declare module "react-qr-barcode-scanner" {
  import { ComponentType } from "react";

  type ScanResult = {
    text: string;
  };

  interface BarcodeScannerProps {
    width?: number;
    height?: number;
    onUpdate: (error: unknown, result: ScanResult | null) => void;
  }

  const BarcodeScannerComponent: ComponentType<BarcodeScannerProps>;
  export default BarcodeScannerComponent;
}
