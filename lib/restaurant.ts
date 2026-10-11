export const restaurant = {
  name: 'Cosmos', descriptor: 'Kitchen + Mocktail Bar',
  address: process.env.NEXT_PUBLIC_RESTAURANT_ADDRESS || '714, SS-2nd Rd, Sector G, LDA Colony, Lucknow, Uttar Pradesh 226012',
  phone: process.env.NEXT_PUBLIC_RESTAURANT_PHONE || '',
  mapsUrl: process.env.NEXT_PUBLIC_MAPS_URL || '',
  hours: ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'].map(day => ({day, time:'12 PM – 11 PM'})),
  currency: 'INR',
};
export const categories = [
  { name: 'Small Plates', description: 'A first taste, made for sharing.' },
  { name: 'From the Kitchen', description: 'Comforting plates with a contemporary touch.' },
  { name: 'Mocktails', description: 'Bright, layered and alcohol-free.' },
];
export const menuItems: {id:string;name:string;description:string;price:number;category:string;available:boolean}[] = [];
