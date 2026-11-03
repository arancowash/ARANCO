const CATALOG = {
  Acura: ['CDX', 'ILX', 'MDX', 'RDX', 'RLX', 'TLX'],
  Audi: ['A3', 'A4', 'A6', 'A8', 'Q2', 'Q3', 'Q5', 'Q7', 'Q8', 'e-tron'],
  BMW: ['3 Series', '5 Series', '7 Series', 'X1', 'X3', 'X5', 'X7', 'i4', 'iX'],
  Chevrolet: ['Aveo', 'Cruze', 'Malibu', 'Sail', 'Spark', 'Trailblazer'],
  Citroen: ['C3', 'C3 Aircross', 'C5 Aircross', 'eC3'],
  Datsun: ['Go', 'Go+', 'redi-GO'],
  Fiat: ['Linea', 'Palio', 'Punto', 'Punto Evo'],
  Ford: ['EcoSport', 'Endeavour', 'Fiesta', 'Figo', 'Focus', 'Fusion', 'Mustang'],
  Honda: ['Accord', 'Amaze', 'BR-V', 'City', 'Civic', 'CR-V', 'Elevate', 'Jazz', 'WR-V'],
  Hyundai: ['Alcazar', 'Aura', 'Creta', 'Elantra', 'Eon', 'Getz', 'Grand i10', 'Grand i10 Nios', 'i10', 'i20', 'i20 Nios', 'Santro', 'Sonata', 'Tucson', 'Venue', 'Verna'],
  Isuzu: ['D-Max', 'MU-X'],
  Jaguar: ['E-Pace', 'F-Pace', 'F-Type', 'XE', 'XF', 'XJ'],
  Jeep: ['Compass', 'Meridian', 'Renegade', 'Wrangler'],
  Kia: ['Carens', 'Carnival', 'Seltos', 'Sonet', 'Sportage'],
  'Land Rover': ['Defender', 'Discovery', 'Discovery Sport', 'Freelander', 'Range Rover', 'Range Rover Evoque', 'Range Rover Sport', 'Range Rover Velar'],
  Lexus: ['ES', 'GX', 'IS', 'LS', 'LX', 'NX', 'RX', 'UX'],
  Mahindra: ['Alturas G4', 'Bolero', 'KUV100', 'Marazzo', 'NuvoSport', 'Scorpio', 'Scorpio Classic', 'Scorpio-N', 'Thar', 'TUV300', 'XUV300', 'XUV700', 'Xylo'],
  'Maruti Suzuki': ['800', 'Alto', 'Alto K10', 'Baleno', 'Brezza', 'Celerio', 'Ciaz', 'Dzire', 'Eeco', 'Ertiga', 'Gypsy', 'Ignis', 'Omni', 'S-Presso', 'Swift', 'SX4', 'Vitara Brezza', 'Wagon R'],
  'Mercedes-Benz': ['A-Class', 'B-Class', 'C-Class', 'CLA', 'CLS', 'E-Class', 'G-Class', 'GLA', 'GLB', 'GLC', 'GLE', 'GLS', 'S-Class', 'V-Class'],
  MG: ['Astor', 'Gloster', 'Hector', 'Hector Plus', 'ZS EV'],
  Mitsubishi: ['Cedia', 'Lancer', 'Montero', 'Outlander', 'Pajero'],
  Nissan: ['Altima', 'Evalia', 'Kicks', 'Magnite', 'Micra', 'Sunny', 'Terrano', 'X-Trail'],
  Renault: ['Captur', 'Duster', 'Kiger', 'Koleos', 'Logan', 'Pulse', 'Scala', 'Triber'],
  Skoda: ['Fabia', 'Kamiq', 'Kushaq', 'Octavia', 'Rapid', 'Slavia', 'Superb'],
  Tata: ['Altroz', 'Bolt', 'Harrier', 'Hexa', 'Indica', 'Indigo', 'Nano', 'Nexon', 'Punch', 'Safari', 'Sumo', 'Tiago', 'Tigor', 'Vista', 'Zest'],
  Toyota: ['Camry', 'Corolla', 'Etios', 'Etios Liva', 'Fortuner', 'Glanza', 'Innova', 'Innova Crysta', 'Land Cruiser', 'Prius', 'Urban Cruiser', 'Yaris'],
  Volkswagen: ['Ameo', 'CrossPolo', 'Golf', 'Jetta', 'Passat', 'Polo', 'Tiguan', 'Vento', 'Virtus'],
  Volvo: ['S60', 'S90', 'V40', 'XC40', 'XC60', 'XC90'],
};

export const OTHER = 'Other';

export const VEHICLE_TYPES = ['Hatchback', 'Sedan', 'SUV', 'MUV', 'Luxury', 'Other'];

export const MAKES = Object.keys(CATALOG).sort((a, b) => a.localeCompare(b));

export const getModels = (make) => (CATALOG[make] ? [...CATALOG[make]].sort((a, b) => a.localeCompare(b)) : []);

export const isKnownMake = (make) => !!make && MAKES.includes(make);
