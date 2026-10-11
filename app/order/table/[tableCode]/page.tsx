import Link from 'next/link';
import { notFound } from 'next/navigation';
import { restaurant } from '@/lib/restaurant';
const validCode = /^T\d{2}$/;
export default async function TableOrderPage({params}:{params:Promise<{tableCode:string}>}) {
 const {tableCode}=await params;
 if(!validCode.test(tableCode)) notFound();
 return <div className="wrap"><header className="nav"><Link className="brand" href="/">cosmos<span>.</span></Link><span className="eyebrow">Table {tableCode}</span></header><main className="section"><div className="eyebrow">Welcome to Cosmos</div><h1 style={{fontFamily:'Georgia,serif',fontWeight:400,fontSize:'clamp(42px,6vw,64px)'}}>Order for your table.</h1><p style={{color:'var(--muted)',lineHeight:1.8,maxWidth:600}}>Browse the menu and send your order directly to our team. You do not need to create an account.</p><div className="notice" style={{margin:'24px 0'}}>Table {tableCode} is identified in this link. Browse the live menu and add items to your order.</div><Link className="btn" href={`/menu?table=${tableCode}`}>View menu</Link></main><footer className="footer"><span>{restaurant.name}: {restaurant.descriptor}</span><span>Table {tableCode}</span></footer></div>
}
