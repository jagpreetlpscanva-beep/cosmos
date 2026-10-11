import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';
const schema=z.object({customerName:z.string().trim().min(2).max(100),phone:z.string().trim().regex(/^[+0-9 ()-]{8,20}$/),tableCode:z.string().trim().regex(/^T\d{2}$/).optional(),orderType:z.enum(['dine_in','takeaway']),items:z.array(z.object({menuItemId:z.string().uuid(),quantity:z.number().int().min(1).max(20)})).min(1).max(40),notes:z.string().trim().max(500).optional()});
export async function POST(req:Request){
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY,restaurantId=process.env.RESTAURANT_ID;
 if(!url||!key||!restaurantId)return NextResponse.json({error:'Ordering is not configured yet. Please contact the restaurant.'},{status:503});
 let raw:unknown;try{raw=await req.json()}catch{return NextResponse.json({error:'Invalid JSON body.'},{status:400})}
 const parsed=schema.safeParse(raw);if(!parsed.success)return NextResponse.json({error:'Please check the order details.',details:parsed.error.flatten()},{status:400});
 const input=parsed.data;const idempotencyKey=req.headers.get('idempotency-key');if(!idempotencyKey||!/^[0-9a-f-]{36}$/i.test(idempotencyKey))return NextResponse.json({error:'A valid order request key is required. Please try again.'},{status:400});
 if(input.orderType==='dine_in'&&!input.tableCode)return NextResponse.json({error:'A table number is required for dine-in orders.'},{status:400});
 if(input.orderType==='takeaway'&&input.tableCode)return NextResponse.json({error:'Takeaway orders cannot be assigned to a table.'},{status:400});
 const supabase=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
 const {data:existing}=await supabase.from('orders').select('id,order_number,status,total').eq('idempotency_key',idempotencyKey).maybeSingle();if(existing)return NextResponse.json({orderNumber:existing.order_number,status:existing.status,total:existing.total},{status:200});
 let tableId:string|null=null;if(input.orderType==='dine_in'&&input.tableCode){const {data:table,error}=await supabase.from('restaurant_tables').select('id,active').eq('restaurant_id',restaurantId).eq('code',input.tableCode).maybeSingle();if(error||!table||!table.active)return NextResponse.json({error:'This table QR code is invalid or inactive.'},{status:400});tableId=table.id;}
 const ids=[...new Set(input.items.map(i=>i.menuItemId))];const {data:menu,error:menuError}=await supabase.from('menu_items').select('id,name,price,available,archived').eq('restaurant_id',restaurantId).in('id',ids);
 if(menuError||!menu||menu.length!==ids.length)return NextResponse.json({error:'Some menu items could not be verified.'},{status:400});
 const lines=[];for(const requested of input.items){const item=menu.find(m=>m.id===requested.menuItemId);if(!item||!item.available||item.archived)return NextResponse.json({error:'An item is unavailable. Please refresh the menu.'},{status:400});const price=Number(item.price);if(!Number.isFinite(price)||price<0)return NextResponse.json({error:'A menu price is invalid. Please contact the restaurant.'},{status:500});lines.push({menu_item_id:item.id,item_name:item.name,quantity:requested.quantity,unit_price:price,line_total:Number((price*requested.quantity).toFixed(2))});}
 const subtotal=Number(lines.reduce((sum,l)=>sum+l.line_total,0).toFixed(2));
 const {data:order,error}=await supabase.from('orders').insert({restaurant_id:restaurantId,customer_name:input.customerName,phone:input.phone,order_type:input.orderType,table_id:tableId,notes:input.notes??null,subtotal,tax:0,fees:0,total:subtotal,status:'new',payment_status:'unpaid',idempotency_key:idempotencyKey}).select('id,order_number,status,total').single();
 if(error||!order){if(error?.code==='23505'){const {data:dup}=await supabase.from('orders').select('order_number,status,total').eq('idempotency_key',idempotencyKey).maybeSingle();if(dup)return NextResponse.json({orderNumber:dup.order_number,status:dup.status,total:dup.total},{status:200});}return NextResponse.json({error:'Could not create order. Please try again.'},{status:500});}
 const {error:linesError}=await supabase.from('order_items').insert(lines.map(l=>({...l,order_id:order.id})));if(linesError){await supabase.from('orders').delete().eq('id',order.id);return NextResponse.json({error:'Order could not be saved completely. Please try again.'},{status:500});}
 return NextResponse.json({orderNumber:order.order_number,status:order.status,total:order.total},{status:201});
}
