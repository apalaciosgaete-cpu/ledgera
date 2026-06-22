export type ChileBank = {
  id: string;
  name: string;
  domain: string;
  website: string;
};

export const CHILE_BANKS: ChileBank[] = [
  { id: "banco-chile", name: "Banco de Chile", domain: "bancochile.cl", website: "https://www.bancochile.cl" },
  { id: "banco-internacional", name: "Banco Internacional", domain: "bancointernacional.cl", website: "https://www.bancointernacional.cl" },
  { id: "scotiabank", name: "Scotiabank", domain: "scotiabankchile.cl", website: "https://www.scotiabankchile.cl" },
  { id: "bci", name: "BCI", domain: "bci.cl", website: "https://www.bci.cl" },
  { id: "bice", name: "Banco BICE", domain: "bice.cl", website: "https://www.bice.cl" },
  { id: "hsbc", name: "HSBC Chile", domain: "hsbc.cl", website: "https://www.hsbc.cl" },
  { id: "santander", name: "Santander", domain: "santander.cl", website: "https://www.santander.cl" },
  { id: "itau", name: "Itaú", domain: "itau.cl", website: "https://www.itau.cl" },
  { id: "security", name: "Banco Security", domain: "bancosecurity.cl", website: "https://www.bancosecurity.cl" },
  { id: "falabella", name: "Banco Falabella", domain: "bancofalabella.cl", website: "https://www.bancofalabella.cl" },
  { id: "ripley", name: "Banco Ripley", domain: "bancoripley.cl", website: "https://www.bancoripley.cl" },
  { id: "consorcio", name: "Banco Consorcio", domain: "bancoconsorcio.cl", website: "https://www.bancoconsorcio.cl" },
  { id: "bancoestado", name: "BancoEstado", domain: "bancoestado.cl", website: "https://www.bancoestado.cl" },
  { id: "btg-pactual", name: "Banco BTG Pactual Chile", domain: "btgpactual.cl", website: "https://www.btgpactual.cl" },
  { id: "jp-morgan", name: "JP Morgan", domain: "jpmorgan.com", website: "https://www.jpmorgan.com/CL/en/about-us" },
  { id: "china-construction-bank", name: "China Construction Bank", domain: "cl.ccb.com", website: "http://cl.ccb.com" },
  { id: "bank-of-china", name: "Bank of China", domain: "bankofchina.com", website: "https://www.bankofchina.com" },
  { id: "mufg", name: "MUFG Bank", domain: "mufg.jp", website: "https://www.mufg.jp" },
  { id: "do-brasil", name: "Banco do Brasil", domain: "bb.com.br", website: "https://www.bb.com.br" },
  { id: "nacion-argentina", name: "Banco de la Nación Argentina", domain: "bna.com.ar", website: "https://www.bna.com.ar" },
];

export function getBankLogoUrl(domain: string) {
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
}

export function findChileBank(id: string) {
  return CHILE_BANKS.find((bank) => bank.id === id);
}
