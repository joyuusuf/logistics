/**
 * Nigerian states with approximate state-capital coordinates and common LGAs.
 * LGA lists are complete for the busiest delivery states and partial elsewhere;
 * LGA inputs accept free text so any LGA can be entered.
 */
export interface StateInfo {
  name: string;
  capital: string;
  lat: number;
  lng: number;
  lgas: string[];
}

export const NIGERIAN_STATES: StateInfo[] = [
  { name: "Abia", capital: "Umuahia", lat: 5.53, lng: 7.49, lgas: ["Aba North", "Aba South", "Umuahia North", "Umuahia South", "Ohafia", "Arochukwu", "Bende", "Isiala Ngwa North"] },
  { name: "Adamawa", capital: "Yola", lat: 9.2, lng: 12.48, lgas: ["Yola North", "Yola South", "Mubi North", "Mubi South", "Numan", "Girei"] },
  { name: "Akwa Ibom", capital: "Uyo", lat: 5.04, lng: 7.92, lgas: ["Uyo", "Eket", "Ikot Ekpene", "Oron", "Itu", "Ibesikpo Asutan"] },
  { name: "Anambra", capital: "Awka", lat: 6.21, lng: 7.07, lgas: ["Awka North", "Awka South", "Onitsha North", "Onitsha South", "Nnewi North", "Nnewi South", "Idemili North", "Ogbaru"] },
  { name: "Bauchi", capital: "Bauchi", lat: 10.31, lng: 9.84, lgas: ["Bauchi", "Azare", "Misau", "Toro", "Ningi"] },
  { name: "Bayelsa", capital: "Yenagoa", lat: 4.92, lng: 6.26, lgas: ["Yenagoa", "Brass", "Ogbia", "Sagbama", "Southern Ijaw"] },
  { name: "Benue", capital: "Makurdi", lat: 7.73, lng: 8.52, lgas: ["Makurdi", "Gboko", "Otukpo", "Katsina-Ala", "Vandeikya"] },
  { name: "Borno", capital: "Maiduguri", lat: 11.83, lng: 13.15, lgas: ["Maiduguri", "Jere", "Konduga", "Biu", "Bama"] },
  { name: "Cross River", capital: "Calabar", lat: 4.95, lng: 8.32, lgas: ["Calabar Municipal", "Calabar South", "Ikom", "Ogoja", "Odukpani"] },
  { name: "Delta", capital: "Asaba", lat: 6.2, lng: 6.73, lgas: ["Oshimili South", "Oshimili North", "Warri South", "Warri North", "Uvwie", "Ughelli North", "Sapele", "Ika South"] },
  { name: "Ebonyi", capital: "Abakaliki", lat: 6.32, lng: 8.11, lgas: ["Abakaliki", "Afikpo North", "Ezza North", "Ikwo", "Ohaukwu"] },
  { name: "Edo", capital: "Benin City", lat: 6.34, lng: 5.63, lgas: ["Oredo", "Egor", "Ikpoba-Okha", "Ovia North-East", "Esan West", "Etsako West", "Uhunmwonde"] },
  { name: "Ekiti", capital: "Ado-Ekiti", lat: 7.62, lng: 5.22, lgas: ["Ado-Ekiti", "Ikere", "Ijero", "Ikole", "Oye", "Efon"] },
  { name: "Enugu", capital: "Enugu", lat: 6.45, lng: 7.51, lgas: ["Enugu North", "Enugu South", "Enugu East", "Nsukka", "Udi", "Nkanu West", "Awgu"] },
  { name: "FCT", capital: "Abuja", lat: 9.06, lng: 7.49, lgas: ["Abuja Municipal (AMAC)", "Bwari", "Gwagwalada", "Kuje", "Kwali", "Abaji"] },
  { name: "Gombe", capital: "Gombe", lat: 10.29, lng: 11.17, lgas: ["Gombe", "Akko", "Billiri", "Kaltungo", "Dukku"] },
  { name: "Imo", capital: "Owerri", lat: 5.48, lng: 7.03, lgas: ["Owerri Municipal", "Owerri North", "Owerri West", "Orlu", "Okigwe", "Mbaitoli"] },
  { name: "Jigawa", capital: "Dutse", lat: 11.76, lng: 9.34, lgas: ["Dutse", "Hadejia", "Kazaure", "Gumel", "Ringim"] },
  { name: "Kaduna", capital: "Kaduna", lat: 10.52, lng: 7.44, lgas: ["Kaduna North", "Kaduna South", "Chikun", "Igabi", "Zaria", "Sabon Gari", "Kafanchan (Jema'a)"] },
  { name: "Kano", capital: "Kano", lat: 12.0, lng: 8.52, lgas: ["Kano Municipal", "Nassarawa", "Fagge", "Gwale", "Tarauni", "Dala", "Ungogo", "Kumbotso"] },
  { name: "Katsina", capital: "Katsina", lat: 12.99, lng: 7.6, lgas: ["Katsina", "Daura", "Funtua", "Malumfashi", "Dutsin-Ma"] },
  { name: "Kebbi", capital: "Birnin Kebbi", lat: 12.45, lng: 4.2, lgas: ["Birnin Kebbi", "Argungu", "Yauri", "Zuru", "Jega"] },
  { name: "Kogi", capital: "Lokoja", lat: 7.8, lng: 6.74, lgas: ["Lokoja", "Okene", "Idah", "Kabba/Bunu", "Ankpa"] },
  { name: "Kwara", capital: "Ilorin", lat: 8.5, lng: 4.55, lgas: ["Ilorin West", "Ilorin East", "Ilorin South", "Offa", "Asa", "Moro"] },
  { name: "Lagos", capital: "Ikeja", lat: 6.6, lng: 3.35, lgas: ["Agege", "Ajeromi-Ifelodun", "Alimosho", "Amuwo-Odofin", "Apapa", "Badagry", "Epe", "Eti-Osa", "Ibeju-Lekki", "Ifako-Ijaiye", "Ikeja", "Ikorodu", "Kosofe", "Lagos Island", "Lagos Mainland", "Mushin", "Ojo", "Oshodi-Isolo", "Shomolu", "Surulere"] },
  { name: "Nasarawa", capital: "Lafia", lat: 8.49, lng: 8.52, lgas: ["Lafia", "Keffi", "Karu", "Akwanga", "Nasarawa"] },
  { name: "Niger", capital: "Minna", lat: 9.61, lng: 6.55, lgas: ["Chanchaga", "Bosso", "Suleja", "Bida", "Kontagora"] },
  { name: "Ogun", capital: "Abeokuta", lat: 7.16, lng: 3.35, lgas: ["Abeokuta North", "Abeokuta South", "Ado-Odo/Ota", "Ifo", "Ijebu Ode", "Sagamu", "Obafemi Owode", "Odeda"] },
  { name: "Ondo", capital: "Akure", lat: 7.25, lng: 5.2, lgas: ["Akure South", "Akure North", "Ondo West", "Owo", "Ilaje", "Ifedore"] },
  { name: "Osun", capital: "Osogbo", lat: 7.77, lng: 4.56, lgas: ["Osogbo", "Olorunda", "Ife Central", "Ife East", "Ilesa East", "Ilesa West", "Ede North"] },
  { name: "Oyo", capital: "Ibadan", lat: 7.38, lng: 3.95, lgas: ["Ibadan North", "Ibadan North-East", "Ibadan North-West", "Ibadan South-East", "Ibadan South-West", "Akinyele", "Egbeda", "Lagelu", "Oluyole", "Ona Ara", "Ido", "Ogbomosho North", "Oyo East"] },
  { name: "Plateau", capital: "Jos", lat: 9.9, lng: 8.86, lgas: ["Jos North", "Jos South", "Jos East", "Bukuru", "Pankshin", "Shendam"] },
  { name: "Rivers", capital: "Port Harcourt", lat: 4.82, lng: 7.03, lgas: ["Port Harcourt", "Obio-Akpor", "Eleme", "Ikwerre", "Oyigbo", "Okrika", "Bonny", "Etche"] },
  { name: "Sokoto", capital: "Sokoto", lat: 13.06, lng: 5.24, lgas: ["Sokoto North", "Sokoto South", "Wamako", "Dange Shuni", "Tambuwal"] },
  { name: "Taraba", capital: "Jalingo", lat: 8.89, lng: 11.37, lgas: ["Jalingo", "Wukari", "Takum", "Bali", "Gembu (Sardauna)"] },
  { name: "Yobe", capital: "Damaturu", lat: 11.75, lng: 11.96, lgas: ["Damaturu", "Potiskum", "Nguru", "Gashua (Bade)", "Geidam"] },
  { name: "Zamfara", capital: "Gusau", lat: 12.16, lng: 6.66, lgas: ["Gusau", "Kaura Namoda", "Talata Mafara", "Anka", "Tsafe"] },
];

export const STATE_NAMES = NIGERIAN_STATES.map((s) => s.name);

export function getState(name: string): StateInfo | undefined {
  return NIGERIAN_STATES.find((s) => s.name.toLowerCase() === name.toLowerCase());
}

export function getLgas(state: string): string[] {
  return getState(state)?.lgas ?? [];
}

/** Realistic street addresses for the mock data, keyed by state and LGA. */
export const SAMPLE_ADDRESSES: { state: string; lga: string; address: string; landmark: string }[] = [
  { state: "Lagos", lga: "Ikeja", address: "14 Allen Avenue, Ikeja", landmark: "Opposite First Bank" },
  { state: "Lagos", lga: "Ikeja", address: "3 Obafemi Awolowo Way, Alausa", landmark: "Near Secretariat gate" },
  { state: "Lagos", lga: "Eti-Osa", address: "27 Admiralty Way, Lekki Phase 1", landmark: "Close to Domino's Pizza" },
  { state: "Lagos", lga: "Eti-Osa", address: "8 Adeola Odeku Street, Victoria Island", landmark: "Behind Eko Hotel" },
  { state: "Lagos", lga: "Eti-Osa", address: "Plot 5, Chevron Drive, Lekki", landmark: "Chevron roundabout" },
  { state: "Lagos", lga: "Surulere", address: "41 Adeniran Ogunsanya Street, Surulere", landmark: "Shoprite mall" },
  { state: "Lagos", lga: "Lagos Mainland", address: "19 Herbert Macaulay Way, Yaba", landmark: "Yaba tech main gate" },
  { state: "Lagos", lga: "Kosofe", address: "6 Ogudu Road, Ojota", landmark: "Ojota bus stop" },
  { state: "Lagos", lga: "Alimosho", address: "22 Iyana Ipaja Road, Egbeda", landmark: "Egbeda roundabout" },
  { state: "Lagos", lga: "Ikorodu", address: "10 Lagos Road, Ikorodu", landmark: "Ikorodu garage" },
  { state: "Lagos", lga: "Lagos Island", address: "55 Broad Street, Lagos Island", landmark: "Opposite Tinubu Square" },
  { state: "Lagos", lga: "Oshodi-Isolo", address: "12 Airport Road, Ajao Estate", landmark: "Near MMA2" },
  { state: "Lagos", lga: "Ibeju-Lekki", address: "Km 42 Lekki-Epe Expressway, Awoyaya", landmark: "Mayfair Gardens" },
  { state: "Oyo", lga: "Ibadan North", address: "18 Bodija Market Road, Bodija", landmark: "Bodija market" },
  { state: "Oyo", lga: "Ibadan North", address: "University of Ibadan, Ajibode Road", landmark: "UI second gate" },
  { state: "Oyo", lga: "Ibadan South-West", address: "7 Ring Road, Challenge", landmark: "Challenge bus stop" },
  { state: "Oyo", lga: "Ibadan North-West", address: "23 Dugbe Street, Dugbe", landmark: "Cocoa House" },
  { state: "Oyo", lga: "Akinyele", address: "4 Ojoo Road, Moniya", landmark: "Ojoo interchange" },
  { state: "FCT", lga: "Abuja Municipal (AMAC)", address: "12 Aminu Kano Crescent, Wuse 2", landmark: "Banex Plaza" },
  { state: "FCT", lga: "Abuja Municipal (AMAC)", address: "Plot 1021 Adetokunbo Ademola Crescent, Maitama", landmark: "Near Transcorp Hilton" },
  { state: "FCT", lga: "Abuja Municipal (AMAC)", address: "33 Gimbiya Street, Garki Area 11", landmark: "Garki Mall" },
  { state: "FCT", lga: "Bwari", address: "5 Kubwa Expressway, Kubwa", landmark: "Kubwa Village Market" },
  { state: "FCT", lga: "Gwagwalada", address: "University of Abuja main campus", landmark: "Gwagwalada junction" },
  { state: "Rivers", lga: "Port Harcourt", address: "15 Aba Road, GRA Phase 2", landmark: "Genesis Centre" },
  { state: "Rivers", lga: "Obio-Akpor", address: "9 Rumuokoro Road, Rumuokoro", landmark: "Rumuokoro flyover" },
  { state: "Rivers", lga: "Port Harcourt", address: "47 Trans-Amadi Industrial Layout", landmark: "Rivers State Polytechnic annex" },
  { state: "Kano", lga: "Nassarawa", address: "11 Bompai Road, Nassarawa GRA", landmark: "Bompai police barracks" },
  { state: "Kano", lga: "Fagge", address: "26 Sabon Gari Market Road", landmark: "Sabon Gari market" },
  { state: "Ogun", lga: "Abeokuta South", address: "8 Kuto Road, Abeokuta", landmark: "Kuto motor park" },
  { state: "Ogun", lga: "Ado-Odo/Ota", address: "Km 38 Lagos-Abeokuta Expressway, Sango-Ota", landmark: "Sango toll gate" },
  { state: "Enugu", lga: "Enugu North", address: "21 Ogui Road, Enugu", landmark: "Polo Park Mall" },
  { state: "Edo", lga: "Oredo", address: "16 Akpakpava Road, Benin City", landmark: "Ring Road" },
  { state: "Kaduna", lga: "Kaduna North", address: "4 Ahmadu Bello Way, Kaduna", landmark: "Murtala Square" },
  { state: "Kwara", lga: "Ilorin West", address: "30 Taiwo Road, Ilorin", landmark: "Post office roundabout" },
  { state: "Osun", lga: "Osogbo", address: "2 Gbongan Road, Osogbo", landmark: "Olaiya junction" },
  { state: "Delta", lga: "Oshimili South", address: "10 Nnebisi Road, Asaba", landmark: "Asaba main market" },
];
