const image = 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=270/app/images/products/sliding_image/450709a.jpg';

const fn = new Function('image', `
  const idMatch = String(image).match(/sliding_image\\/(\\d+)/i) || String(image).match(/\\/(\\d+)[a-zA-Z_.]/i);
  return idMatch ? idMatch[1] : null;
`);

console.log(fn(image));
