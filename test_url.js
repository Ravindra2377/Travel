let obj = {};
let url = obj?.deep_link || obj?.url || '';
if (!url && obj?.product_id) {
  url = '/prn/x/prid/' + obj.product_id;
} else if (!url && obj?.id) {
  url = '/prn/x/prid/' + obj.id;
} else if (!url && obj?.inventory_id) {
  url = '/prn/x/prid/' + obj.inventory_id;
}
if (url && url.startsWith('/')) {
  url = 'https://blinkit.com' + url;
}
console.log("URL:", url);
