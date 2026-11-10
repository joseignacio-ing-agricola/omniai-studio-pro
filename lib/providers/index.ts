export type Msg={role:'system'|'user'|'assistant';content:string};
export type ProviderId='gemini'|'groq'|'openrouter'|'ollama';
export type Provider={id:ProviderId;label:string;enabled:boolean;model:string};
const ollamaUrl=process.env.OLLAMA_BASE_URL||'http://127.0.0.1:11434';
export function providers():Provider[]{return [
{id:'gemini',label:'Google Gemini',enabled:!!process.env.GEMINI_API_KEY,model:'gemini-2.5-flash'},
{id:'groq',label:'Groq',enabled:!!process.env.GROQ_API_KEY,model:'llama-3.3-70b-versatile'},
{id:'openrouter',label:'OpenRouter',enabled:!!process.env.OPENROUTER_API_KEY,model:'openrouter/free'},
{id:'ollama',label:'Ollama (local)',enabled:!!process.env.OLLAMA_MODEL,model:process.env.OLLAMA_MODEL||'llama3.2'}]}
export class ProviderError extends Error{constructor(message:string,public status:number){super(message)}}
async function request(url:string,body:unknown,headers:Record<string,string>,timeout=45000){const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),timeout);try{const r=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json',...headers},body:JSON.stringify(body),signal:controller.signal,cache:'no-store'});const data=await r.json().catch(()=>({}));if(!r.ok)throw new ProviderError(`Provider HTTP ${r.status}`,r.status);return data}finally{clearTimeout(timer)}}
export async function generate(p:Provider,messages:Msg[]):Promise<string>{let data:any;switch(p.id){
case 'gemini':{const system=messages.filter(m=>m.role==='system').map(m=>m.content).join('\n');const history=messages.filter(m=>m.role!=='system');data=await request(`https://generativelanguage.googleapis.com/v1beta/models/${p.model}:generateContent`,{systemInstruction:system?{parts:[{text:system}]}:undefined,contents:history.map(m=>({role:m.role==='assistant'?'model':'user',parts:[{text:m.content}]})),generationConfig:{maxOutputTokens:2048}},{'x-goog-api-key':process.env.GEMINI_API_KEY!});return data.candidates?.[0]?.content?.parts?.map((x:any)=>x.text||'').join('')||''}
case 'groq':data=await request('https://api.groq.com/openai/v1/chat/completions',{model:p.model,messages,temperature:0.5,max_tokens:2048},{Authorization:`Bearer ${process.env.GROQ_API_KEY}`});return data.choices?.[0]?.message?.content||'';
case 'openrouter':data=await request('https://openrouter.ai/api/v1/chat/completions',{model:p.model,messages,max_tokens:2048},{Authorization:`Bearer ${process.env.OPENROUTER_API_KEY}`,'HTTP-Referer':'https://example.com','X-Title':'OmniAI Studio PRO'});return data.choices?.[0]?.message?.content||'';
case 'ollama':data=await request(`${ollamaUrl.replace(/\/$/,'')}/api/chat`,{model:p.model,messages,stream:false,options:{num_predict:2048}},{},60000);return data.message?.content||'';
}}
export function recoverable(e:unknown){if(e instanceof ProviderError)return [408,409,429,500,502,503,504].includes(e.status)||e.status===402;return e instanceof Error&&(e.name==='AbortError'||e instanceof TypeError)}