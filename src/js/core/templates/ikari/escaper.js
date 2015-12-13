// import Ikari = require '../ikari'

let safe = (val)=> {
  if(typeof val == "number" || typeof val == "object")
    return val;
  if(!val)
    return "";

  let str = val.replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
  return str;
}
export default safe
