const m={donations:"query laacQuery($board: [ID!]!, $group: [ID!]!) { boards (ids: [$board] { groups (ids: [$group]) { title id }}",donors:"query laacQuery($board: [ID!]!, $group: [ID!]!) { boards (ids: [$board] { groups (ids: [$group]) { title id }}}"},y={donorTracking:m};function $(o){const s=o.includes(" & ")||o.includes(" and "),n=o.indexOf(" ");if(n<0)return o;if(s){console.log(o," is a couple");const e=o.split(" "),a=e.indexOf("&")||e.indexOf("and"),r=e[0],i=e[a+1],d=e[e.length-1].slice(0,1);return`${r} & ${i} ${d}`}else{const e=o.slice(0,n),a=o[n+1]||"";return`${e} ${a}`}}async function g(){console.log("Hello, Los Alamos, NV!");const o="donorTracking",s="donations",n="https://api.monday.com/v2",e=y[o][s],r=await I(n,e,{});if(document.getElementById("sponsorDashboard")){console.log("Intialize Sponsor Creation...");const i=b(r),d=h(i);console.log("Merged Sponsors:",d);const l=[{title:"Greater than $1000",predicate:t=>t>1e3},{title:"$500-$999",predicate:t=>t>=500&&t<=999},{title:"$250-$499",predicate:t=>t>=250&&t<=499},{title:"$100-$249",predicate:t=>t>=100&&t<=249},{title:"Less than $100",predicate:t=>t<100}].map(t=>{const p=d.filter(c=>t.predicate(c.total)).map(c=>$(c.name));return p.length?`<section class="breakdown">
                <details open>
                    <summary>${t.title}</summary>
                    <div class="sponsor__container">
                        ${p.map(c=>`<p>${c}</p>`).join("")}
                    </div>
                </details>
            </section>`:""}).join("");document.getElementById("sponsorDashboard").innerHTML=l}}function f(o){const s=new Date(o),n=String(s.getUTCMonth()+1).padStart(2,"0"),e=String(s.getUTCDate()).padStart(2,"0"),a=s.getUTCFullYear();return`${n}/${e}/${a}`}function b(o){var a;const s=o.boards[0].groups[0];console.log("Sanitaze group dump:",s);const e=((a=s.items_page)==null?void 0:a.items).map(r=>{var d,u,l,t;let i;return JSON.parse((d=r.column_values[1])==null?void 0:d.value)?i=JSON.parse((u=r.column_values[1])==null?void 0:u.value):(console.warn("Warning: Missing or invalid date for item:",r.name,"Using current date instead."),i={changed_at:new Date().toISOString()}),{name:r.name,donations:[{value:Number((t=(l=r.column_values[0])==null?void 0:l.value)==null?void 0:t.slice(1,-1)),timestamp:f(i.changed_at)}]}});return console.log("Sanitaze group dump:",e),e}function h(o){const s=new Map;for(const n of o){const e=n.donations.reduce((r,i)=>r+i.value,0),a=s.get(n.name);a?(a.donations.push(...n.donations),a.total+=e):s.set(n.name,{name:n.name,donations:[...n.donations],total:e})}return Array.from(s.values())}async function I(o,s,n={}){try{const e=await fetch(o,{method:"POST",headers:{"Content-Type":"application/json",Authorization:"Bearer eyJhbGciOiJIUzI1NiJ9.eyJ0aWQiOjY0Mjc5MzAwNCwiYWFpIjoxMSwidWlkIjo2ODE0NTk5NSwiaWFkIjoiMjAyNi0wNC0wOFQwMDoxOTozNC43NDBaIiwicGVyIjoibWU6d3JpdGUiLCJhY3RpZCI6MjYyNzI0OTcsInJnbiI6InVzZTEifQ.uZKtnLsRmaD9N1ATFsuybvKxLGUf-vkq73DICNwEtYE"},body:JSON.stringify({query:`query laacQuery($board: ID!, $group: String){
            boards(ids: [$board]) {
                groups(ids: [$group]) {
                title
                id
                    items_page(limit: 500) {
                        items {
                        id
                        name
                            column_values(ids: ["numbers", "status7"]) {
                                value
                            }
                        }
                    }
                }
            }
        }`,variables:{board:9408133671,group:"group_mks1945c"}})}),{data:a,errors:r}=await e.json();if(!e.ok)throw new Error(`HTTP error! Status: ${e.status}`);if(r)throw new Error(r.map(i=>i.message).join(", "));return console.log("GraphQL response data:",a),a}catch(e){throw console.error("Fetch failed:",e),e}}document.addEventListener("DOMContentLoaded",g);document.addEventListener("page:loaded",g);
