const KEY = "maintenance-demo-v1";

const starterRecords = [
  {id:1,title:"Broken classroom light",category:"Electrical",description:"The ceiling light in Lecture Room B12 does not switch on, leaving the back row poorly lit.",status:"Pending"},
  {id:2,title:"Leaking tap near cafeteria",category:"Plumbing",description:"The cold-water tap outside the main cafeteria continues to leak after it is turned off.",status:"In progress"},
  {id:3,title:"Damaged library chair",category:"Furniture",description:"A chair on the first floor of the library has a loose leg and needs repair.",status:"Pending"},
  {id:4,title:"Blocked washroom drain",category:"Plumbing",description:"Water is draining slowly in the washroom beside the science block.",status:"Completed"},
  {id:5,title:"Faulty corridor switch",category:"Electrical",description:"The light switch in the Engineering Block east corridor is not responding.",status:"In progress"},
  {id:6,title:"Broken desk in Room C04",category:"Furniture",description:"One student desk in classroom C04 has a detached writing surface.",status:"Pending"},
  {id:7,title:"Overgrown walkway grass",category:"Grounds & Landscaping",description:"Grass along the walkway between the hostels and lecture halls needs trimming.",status:"Completed"},
  {id:8,title:"Roof leak above office",category:"Building / Structural",description:"Water drips from the ceiling above the administration office during heavy rain.",status:"Pending"}
];

function readRecords() {
  const raw = localStorage.getItem(KEY);
  if (raw === null) {
    localStorage.setItem(KEY, JSON.stringify(starterRecords));
    return [...starterRecords];
  }
  try {
    const records = JSON.parse(raw);
    return Array.isArray(records) ? records : [];
  } catch {
    return [];
  }
}

function writeRecords(records) {
  localStorage.setItem(KEY, JSON.stringify(records));
}

export const recordService = {
  async list() {
    return readRecords();
  },
  async get(id) {
    const record = readRecords().find(item => item.id === Number(id));
    if (!record) throw new Error("The requested record could not be found.");
    return record;
  },
  async create(record) {
    const records = readRecords();
    const nextId = records.reduce((highest, item) => Math.max(highest, Number(item.id) || 0), 0) + 1;
    const created = {id:nextId, title:record.title, category:record.category, description:record.description, status:record.status};
    records.push(created);
    writeRecords(records);
    return created;
  },
  async update(id, record) {
    const records = readRecords();
    const index = records.findIndex(item => item.id === Number(id));
    if (index === -1) throw new Error("The request no longer exists.");
    records[index] = {id:records[index].id, title:record.title, category:record.category, description:record.description, status:record.status};
    writeRecords(records);
    return records[index];
  },
  async remove(id) {
    const records = readRecords();
    const updated = records.filter(item => item.id !== Number(id));
    if (updated.length === records.length) throw new Error("The request could not be found.");
    writeRecords(updated);
    return "Request deleted successfully.";
  }
};
