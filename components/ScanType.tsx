export interface ScanTypeProps {
  /**
   * Raw JSON of the scan.
   */
  data: object;
  /**
   * Name of the scan.
   */
  name: string;
  /**
   * Click callback.
   */
  onClick: () => void;
}
export default function ScanType({ name, onClick }: ScanTypeProps) {
  return (
    <div
      className="bg-white p-6 rounded-lg cursor-pointer border-2 transition-all duration-300 hover:shadow-lg"
      style={{ borderColor: '#e5e7eb' }}
      onClick={onClick}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = '#1a3a6e';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = '#e5e7eb';
      }}
    >
      <div className="text-center text-lg font-medium" style={{ color: '#1a3a6e' }}>
        {name}
      </div>
    </div>
  );
}
