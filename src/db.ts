import Dexie, { type Table } from 'dexie';

export interface Product {
  id?: number;
  nameGujarati: string;
  nameEnglish: string;
  weight: string;
  price: number;
  stock: number;
  createdAt: number;
}

export interface Shop {
  id?: number;
  code: string;
  name: string;
  owner: string;
  contact: string;
  area: string;
  address: string;
  creditLimit: number;
  createdAt: number;
}

export interface OrderItem {
  productId: number;
  name: string;
  weight: string;
  quantity: number;
  rate: number;
  discount: number;
  total: number;
}

export interface Order {
  id?: number;
  orderNumber: string;
  shopId: number;
  shopName: string;
  orderDate: string; // ISO date string
  deliveryDate: string; // ISO date string
  products: OrderItem[];
  subtotal: number;
  discount: number;
  grandTotal: number;
  paymentStatus: 'Cash' | 'Credit' | 'Pending';
  createdAt: number;
}

export class MasalaDatabase extends Dexie {
  products!: Table<Product>;
  shops!: Table<Shop>;
  orders!: Table<Order>;

  constructor() {
    super('MasalaWholesaleDB');
    this.version(3).stores({
      products: '++id, nameGujarati, nameEnglish, stock',
      shops: '++id, code, name, area',
      orders: '++id, orderNumber, shopId, orderDate, deliveryDate, paymentStatus, createdAt'
    });
  }
}

export const db = new MasalaDatabase();

export const INITIAL_PRODUCTS: Omit<Product, 'id' | 'createdAt'>[] = [
  { nameGujarati: "ફરાળી ઢોકળા લોટ", nameEnglish: "Farali Dhokla Flour", weight: "150gm (10p.)", price: 0, stock: 100 },
  { nameGujarati: "ફરાળી રાજગરા લોટ", nameEnglish: "Farali Rajgara Flour", weight: "200gm (10p.)", price: 0, stock: 100 },
  { nameGujarati: "ચાહ મસાલા", nameEnglish: "Tea Masala", weight: "15gm (10p.)", price: 100, stock: 100 },
  { nameGujarati: "ગ્રીન પાવભાજી મસાલા", nameEnglish: "Green Pavbhaji Masala", weight: "40gm (06p.)", price: 100, stock: 100 },
  { nameGujarati: "મરચા આચાર મસાલા", nameEnglish: "Chilli Pickle Masala", weight: "60gm (10p.)", price: 100, stock: 100 },
  { nameGujarati: "મટર પનીર મસાલા (નાના)", nameEnglish: "Mutter Paneer Masala (Small)", weight: "20gm (10p.)", price: 100, stock: 100 },
  { nameGujarati: "પનીર ભુર્જી મસાલા (નાના)", nameEnglish: "Paneer Bhurji Masala (Small)", weight: "20gm (10p.)", price: 100, stock: 100 },
  { nameGujarati: "હાજમા હજમ પાણીપુરી મસાલા", nameEnglish: "Hajma Hajam Panipuri Masala", weight: "80gm (06p.)", price: 100, stock: 100 },
  { nameGujarati: "બોમ્બે પાનીપુરી મસાલા", nameEnglish: "Bombay Panipuri Masala", weight: "40gm (10p.)", price: 110, stock: 100 },
  { nameGujarati: "પાનીપુરી પાવડર મસાલા", nameEnglish: "Panipuri Powder Masala", weight: "25gm (20p.)", price: 110, stock: 100 },
  { nameGujarati: "બટાકા ભુંગળા મસાલા", nameEnglish: "Bataka Bhungla Masala", weight: "40gm (10p.)", price: 115, stock: 100 },
  { nameGujarati: "લસણીયા બટાકા મસાલા", nameEnglish: "Lasaniya Bataka Masala", weight: "40gm (10p.)", price: 115, stock: 100 },
  { nameGujarati: "ચેવડા મસાલા", nameEnglish: "Chevda Masala", weight: "40gm (20p.)", price: 120, stock: 100 },
  { nameGujarati: "દાબેલી મસાલા", nameEnglish: "Dabeli Masala", weight: "80gm (10pc)", price: 120, stock: 100 },
  { nameGujarati: "જૈન મન્ચૂરીયન મસાલા", nameEnglish: "Jain Manchurian Masala", weight: "40gm (10p.)", price: 120, stock: 100 },
  { nameGujarati: "મન્ચૂરીયન મસાલા", nameEnglish: "Manchurian Masala", weight: "40gm (10p.)", price: 120, stock: 100 },
  { nameGujarati: "ભરેલશાક મસાલા (નાના)", nameEnglish: "Bharel Shak Masala (Small)", weight: "75gm (10p.)", price: 130, stock: 100 },
  { nameGujarati: "મસાલા ઢોસા", nameEnglish: "Masala Dosa", weight: "40gm (12p.)", price: 135, stock: 100 },
  { nameGujarati: "2IN1 પાનીપુરી", nameEnglish: "2 IN 1 Panipuri", weight: "60gm (11p.)", price: 150, stock: 100 },
  { nameGujarati: "આખા કાંદા મસાલા (નાના)", nameEnglish: "Akha Kanda Masala (Small)", weight: "50gm (11p.)", price: 150, stock: 100 },
  { nameGujarati: "આખા રીંગણ મસાલા (નાના)", nameEnglish: "Akha Ringan Masala (Small)", weight: "50gm (11p.)", price: 150, stock: 100 },
  { nameGujarati: "કાજુ-લસણ મસાલા", nameEnglish: "Kaju Lasan Masala", weight: "50gm (06p.)", price: 155, stock: 100 },
  { nameGujarati: "2 IN 1 વડાપાવ મસાલા", nameEnglish: "2 IN 1 Vadapav Masala", weight: "60gm (12p.)", price: 155, stock: 100 },
  { nameGujarati: "બોમ્બે પાવભાજી મસાલા", nameEnglish: "Bombay Pavbhaji Masala", weight: "40gm (12p.)", price: 155, stock: 100 },
  { nameGujarati: "ગોટાળો મસાલા", nameEnglish: "Gotalo Masala", weight: "40gm (11p.)", price: 155, stock: 100 },
  { nameGujarati: "મૈસૂર મસાલા", nameEnglish: "Mysore Masala", weight: "40gm (12p.)", price: 155, stock: 100 },
  { nameGujarati: "મદ્રાસી ઇડલી સંભાર મસાલા", nameEnglish: "Madrasi Idli Sambhar Masala", weight: "50gm (12p.)", price: 155, stock: 100 },
  { nameGujarati: "ઢોસા પેપર મસાલા", nameEnglish: "Dosa Paper Masala", weight: "25gm (12p.)", price: 155, stock: 100 },
  { nameGujarati: "ભરેલશાક મસાલા", nameEnglish: "Bharel Shak Masala", weight: "170gm (06p.)", price: 170, stock: 100 },
  { nameGujarati: "ખીચડી મસાલા", nameEnglish: "Khichdi Masala", weight: "50gm (10p.)", price: 185, stock: 100 },
  { nameGujarati: "કઢી મસાલા", nameEnglish: "Kadhi Masala", weight: "50gm (10p.)", price: 185, stock: 100 },
  { nameGujarati: "દાબેલી બોક્સ મસાલા", nameEnglish: "Dabeli Box Masala", weight: "80gm (10p.)", price: 200, stock: 100 },
  { nameGujarati: "આખા કાંદા મસાલા", nameEnglish: "Akha Kanda Masala", weight: "100gm (10p.)", price: 250, stock: 100 },
  { nameGujarati: "આખા રીંગણ મસાલા", nameEnglish: "Akha Ringan Masala", weight: "100gm (10p.)", price: 250, stock: 100 },
  { nameGujarati: "જૈન કાજુકરી મસાલા", nameEnglish: "Jain Kajukari Masala", weight: "50gm (11p.)", price: 250, stock: 100 },
  { nameGujarati: "કાજુ-ગાઠીયા મસાલા", nameEnglish: "Kaju Gathiya Masala", weight: "100gm (10p.)", price: 250, stock: 100 },
  { nameGujarati: "કાજુકરી મસાલા", nameEnglish: "Kajukari Masala", weight: "50gm (11p.)", price: 250, stock: 100 },
  { nameGujarati: "કાજુ-પનીર મસાલા", nameEnglish: "Kaju Paneer Masala", weight: "50gm (11p.)", price: 250, stock: 100 },
  { nameGujarati: "પનીર ટીક્કા મસાલા", nameEnglish: "Paneer Tikka Masala", weight: "50gm (11p.)", price: 250, stock: 100 },
  { nameGujarati: "છોલે મસાલા", nameEnglish: "Chole Masala", weight: "50gm (11p.)", price: 250, stock: 100 },
  { nameGujarati: "મટર પનીર મસાલા", nameEnglish: "Mutter Paneer Masala", weight: "50gm (11p.)", price: 250, stock: 100 },
  { nameGujarati: "પનીર ભુર્જી મસાલા", nameEnglish: "Paneer Bhurji Masala", weight: "50gm (11p.)", price: 250, stock: 100 },
  { nameGujarati: "પાલક-પનીર મસાલા", nameEnglish: "Palak Paneer Masala", weight: "50gm (11p.)", price: 250, stock: 100 },
  { nameGujarati: "જૈન પનીર ટીક્કા મસાલા", nameEnglish: "Jain Paneer Tikka Masala", weight: "50gm (11p.)", price: 250, stock: 100 },
  { nameGujarati: "ઓરેગાનો મસાલા", nameEnglish: "Oregano Masala", weight: "15gm (10p.)", price: 80, stock: 100 },
  { nameGujarati: "આલુ-પરાઠા મસાલા", nameEnglish: "Aloo Paratha Masala", weight: "20gm (10p.)", price: 80, stock: 100 },
  { nameGujarati: "આમચૂર પાવડર", nameEnglish: "Amchur Powder", weight: "20gm (10p.)", price: 80, stock: 100 },
  { nameGujarati: "સ્પે. પનીર મસાલા", nameEnglish: "Spl. Paneer Masala", weight: "20gm (10p.)", price: 80, stock: 100 },
  { nameGujarati: "બિરિયાની મસાલા", nameEnglish: "Biryani Masala", weight: "20gm (10p.)", price: 80, stock: 100 },
  { nameGujarati: "બ્રેડ પકોડા મસાલા", nameEnglish: "Bread Pakoda Masala", weight: "20gm (10p.)", price: 80, stock: 100 },
  { nameGujarati: "બોમ્બે પાવભાજી મસાલા (નાના)", nameEnglish: "Bombay Pavbhaji Masala (Small)", weight: "20gm (10p.)", price: 80, stock: 100 },
  { nameGujarati: "બોમ્બે વડાપાવ મસાલા", nameEnglish: "Bombay Vadapav Masala", weight: "50gm (10p.)", price: 80, stock: 100 },
  { nameGujarati: "બટાકા ચીપ્સ મસાલા", nameEnglish: "Bataka Chips Masala", weight: "20gm (10p.)", price: 80, stock: 100 },
  { nameGujarati: "બટાકાવડા મસાલા", nameEnglish: "Batakiwada Masala", weight: "50gm (10p.)", price: 80, stock: 100 },
  { nameGujarati: "છોલે મસાલા", nameEnglish: "Chole Masala", weight: "20gm (10p.)", price: 80, stock: 100 },
  { nameGujarati: "છાશ મસાલા", nameEnglish: "Chhash Masala", weight: "40gm (10p.)", price: 80, stock: 100 },
  { nameGujarati: "ચાટ મસાલા", nameEnglish: "Chaat Masala", weight: "20gm (10p.)", price: 80, stock: 100 },
  { nameGujarati: "ચટાકેદાર ઉંધીયુ મસાલા", nameEnglish: "Chatakedar Undhiyu Masala", weight: "20gm (10p.)", price: 80, stock: 100 },
  { nameGujarati: "દાળફ્રાય/દાળ-તડકા મસાલા", nameEnglish: "Dal Fry / Dal Tadka Masala", weight: "20gm (10p.)", price: 80, stock: 100 },
  { nameGujarati: "દમઆલુ મસાલા", nameEnglish: "Dum Aloo Masala", weight: "20gm (10p.)", price: 80, stock: 100 },
  { nameGujarati: "ઇટાલીયન પીઝા મસાલા", nameEnglish: "Italian Pizza Masala", weight: "20gm (10p.)", price: 80, stock: 100 },
  { nameGujarati: "ફ્રેન્કી મસાલા", nameEnglish: "Frankie Masala", weight: "20gm (10p.)", price: 80, stock: 100 },
  { nameGujarati: "ગ્રીલ સેન્ડવીચ મસાલા", nameEnglish: "Grill Sandwich Masala", weight: "20gm (10p.)", price: 80, stock: 100 },
  { nameGujarati: "જળજીરા મસાલા", nameEnglish: "Jaljira Masala", weight: "20gm (10p.)", price: 80, stock: 100 },
  { nameGujarati: "ખીચડી મસાલા (નાના)", nameEnglish: "Khichdi Masala (Small)", weight: "20gm (10p.)", price: 80, stock: 100 },
  { nameGujarati: "ખીચડી-કઢી મસાલા (નાના)", nameEnglish: "Khichdi Kadhi Masala (Small)", weight: "20gm (10p.)", price: 80, stock: 100 },
  { nameGujarati: "કીચન કીંગ મસાલા", nameEnglish: "Kitchen King Masala", weight: "20gm (10p.)", price: 80, stock: 100 },
  { nameGujarati: "કાજુકરી મસાલા (નાના)", nameEnglish: "Kajukari Masala (Small)", weight: "20gm (10p.)", price: 80, stock: 100 },
  { nameGujarati: "લસણીયા ચટપટા સેવ-મમરા", nameEnglish: "Lasaniya Chatpata Sev Mamra", weight: "20gm (10p.)", price: 80, stock: 100 },
  { nameGujarati: "મૈસૂર મસાલા (નાના)", nameEnglish: "Mysore Masala (Small)", weight: "20gm (10p.)", price: 80, stock: 100 },
  { nameGujarati: "મકાઇ ચેવડો મસાલા", nameEnglish: "Makai Chevdo Masala", weight: "20gm (10p.)", price: 80, stock: 100 },
  { nameGujarati: "મદ્રાસી ઇડલી સંભાર મસાલા", nameEnglish: "Madrasi Idli Sambhar Masala", weight: "20gm (10p.)", price: 80, stock: 100 },
  { nameGujarati: "પેપ્રીકા મસાલા", nameEnglish: "Paprika Masala", weight: "15gm (10p.)", price: 80, stock: 100 },
  { nameGujarati: "પેરી-પેરી મસાલા", nameEnglish: "Peri Peri Masala", weight: "20gm (10p.)", price: 80, stock: 100 },
  { nameGujarati: "પંજાબી ગ્રેવી મસાલા", nameEnglish: "Punjabi Gravy Masala", weight: "20gm (10p.)", price: 80, stock: 100 },
  { nameGujarati: "પોપકોર્ન મસાલા", nameEnglish: "Popcorn Masala", weight: "20gm (10p.)", price: 80, stock: 100 },
  { nameGujarati: "પાસ્તા મસાલા", nameEnglish: "Pasta Masala", weight: "20gm (10p.)", price: 80, stock: 100 },
  { nameGujarati: "પાલક-પનીર મસાલા", nameEnglish: "Palak Paneer Masala", weight: "20gm (10p.)", price: 80, stock: 100 },
  { nameGujarati: "પનીર ટીક્કા મસાલા (નાના)", nameEnglish: "Paneer Tikka Masala (Small)", weight: "20gm (10p.)", price: 80, stock: 100 },
  { nameGujarati: "રીંગણ ભડથુ મસાલા", nameEnglish: "Ringan Bharthu Masala", weight: "20gm (10p.)", price: 80, stock: 100 },
  { nameGujarati: "રગડા મસાલા", nameEnglish: "Ragda Masala", weight: "20gm (10p.)", price: 80, stock: 100 },
  { nameGujarati: "સેવ-ઉસળ મસાલા", nameEnglish: "Sev Usal Masala", weight: "20gm (10p.)", price: 80, stock: 100 },
  { nameGujarati: "શાહી પુલાવ મસાલા", nameEnglish: "Shahi Pulao Masala", weight: "20gm (10p.)", price: 80, stock: 100 },
  { nameGujarati: "સમોસા મસાલા", nameEnglish: "Samosa Masala", weight: "20gm (10p.)", price: 80, stock: 100 },
  { nameGujarati: "ટેસ્ટી લોચો મસાલા", nameEnglish: "Tasty Locho Masala", weight: "20gm (10p.)", price: 80, stock: 100 },
  { nameGujarati: "ટસ્ટી સેન્ડવીચ મસાલા", nameEnglish: "Tasty Sandwich Masala", weight: "20gm (10p.)", price: 80, stock: 100 },
  { nameGujarati: "વડાપાવ ચટણી મસાલા", nameEnglish: "Vadapav Chatni Masala", weight: "20gm (10p.)", price: 80, stock: 100 },
  { nameGujarati: "સેવ-ટમેટા મસાલા", nameEnglish: "Sev Tameta Masala", weight: "20gm (10p.)", price: 80, stock: 100 },
  { nameGujarati: "ખીચડી-કઢી મસાલા", nameEnglish: "Khichdi Kadhi Masala", weight: "50gm (10p.)", price: 185, stock: 100 },
  { nameGujarati: "ગ્રીન ઉંધીયુ મસાલા", nameEnglish: "Green Undhiyu Masala", weight: "25gm (06p.)", price: 90, stock: 100 },
  { nameGujarati: "મીઠી ચટણી મસાલા", nameEnglish: "Mithi Chatni Masala", weight: "40gm (20p.)", price: 90, stock: 100 },
  { nameGujarati: "મરચા આચાર મસાલા", nameEnglish: "Chilli Pickle Masala", weight: "50gm (10p.)", price: 90, stock: 100 }
];
