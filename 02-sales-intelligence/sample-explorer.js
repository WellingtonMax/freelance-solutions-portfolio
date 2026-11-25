"use strict";
(function(){
 const category=document.getElementById("category");
 const rows=Array.from(document.querySelectorAll("#rows tr"));
 const money=cents=>"$"+(cents/100).toFixed(2);
 const bars=document.getElementById("bars");
 function render(){
  const selected=category.value;
  let revenue=0,units=0,orders=0;
  const categories=new Map();
  for(const row of rows){
   const visible=selected==="All"||row.dataset.category===selected;
   row.hidden=!visible;
   if(!visible)continue;
   const cents=Number(row.dataset.cents);
   revenue+=cents;units+=Number(row.dataset.units);orders++;
   categories.set(row.dataset.category,(categories.get(row.dataset.category)||0)+cents);
  }
  document.getElementById("revenue").textContent=money(revenue);
  document.getElementById("orders").textContent=String(orders);
  document.getElementById("orders").setAttribute("data-count", orders);
  document.getElementById("revenue").setAttribute("data-cents", revenue);
  document.getElementById("units").textContent=String(units);
  document.getElementById("average").textContent=money(orders?Math.round(revenue/orders):0);
  document.getElementById("status").textContent="Showing "+orders+" fictional "+(orders===1?"order":"orders")+" in "+(selected==="All"?"all categories":selected)+".";
  bars.replaceChildren();
  const max=Math.max(1,...categories.values());
  for(const [name,cents] of categories){
   const row=document.createElement("div");row.className="bar-row";
   const label=document.createElement("strong");label.textContent=name;
   const track=document.createElement("div");track.className="track";
   const fill=document.createElement("div");fill.className="fill";fill.style.width=(cents/max*100).toFixed(1)+"%";
   const value=document.createElement("span");value.className="amount";value.textContent=money(cents);
   track.append(fill);row.append(label,track,value);bars.append(row);
  }
 }
 category.addEventListener("change",render);
 render();
})();
