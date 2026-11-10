import { createBrowserClient, createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
export function browserDb(){return createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)}
export async function serverDb(){const jar=await cookies();return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,{cookies:{getAll(){return jar.getAll()},setAll(items){try{items.forEach(({name,value,options})=>jar.set(name,value,options))}catch{}}}})}