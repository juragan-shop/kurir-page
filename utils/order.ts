
export type Order = {
  id: string;
  namaBarang: string;
  deskripsi: string;
  jumlahBarang: number | string;
  hargaBarang: number
  totalHarga:number
  adminStatus: string;
  supplierStatus: string;
  courierStatus: string;
  createdAt: string;
  updatedAt: string;
};