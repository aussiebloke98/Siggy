export interface ParsedContact {
  name: string;
  email: string;
  phone: string;
  company: string;
  tags: string[];
}

function parseCSVLine(line: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      fields.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  fields.push(current.trim());
  return fields;
}

export function parseCSV(text: string): ParsedContact[] {
  const lines = text.trim().split(/\r?\n/).filter((l) => l.trim());
  if (lines.length === 0) return [];

  const header = parseCSVLine(lines[0]).map((h) => h.toLowerCase());
  const nameIdx = header.findIndex((h) => h.includes('name'));
  const emailIdx = header.findIndex((h) => h.includes('email'));
  const phoneIdx = header.findIndex((h) => h.includes('phone'));
  const companyIdx = header.findIndex((h) => h.includes('company'));
  const tagsIdx = header.findIndex((h) => h.includes('tag'));

  const contacts: ParsedContact[] = [];
  for (let i = 1; i < lines.length; i++) {
    const fields = parseCSVLine(lines[i]);
    contacts.push({
      name: nameIdx >= 0 ? fields[nameIdx] || '' : '',
      email: emailIdx >= 0 ? fields[emailIdx] || '' : '',
      phone: phoneIdx >= 0 ? fields[phoneIdx] || '' : '',
      company: companyIdx >= 0 ? fields[companyIdx] || '' : '',
      tags: tagsIdx >= 0
        ? (fields[tagsIdx] || '').split(';').map((t) => t.trim()).filter(Boolean)
        : [],
    });
  }
  return contacts;
}

export function parseJSON(text: string): ParsedContact[] {
  const data = JSON.parse(text);
  if (!Array.isArray(data)) throw new Error('JSON must be an array of contact objects');
  return data.map((item: Record<string, unknown>) => ({
    name: String(item.name ?? ''),
    email: String(item.email ?? ''),
    phone: String(item.phone ?? ''),
    company: String(item.company ?? ''),
    tags: Array.isArray(item.tags)
      ? item.tags.map(String)
      : typeof item.tags === 'string'
        ? item.tags.split(';').map((t: string) => t.trim()).filter(Boolean)
        : [],
  }));
}

export function parseContacts(text: string, format: 'csv' | 'json'): ParsedContact[] {
  return format === 'csv' ? parseCSV(text) : parseJSON(text);
}

export function detectFormat(filename: string): 'csv' | 'json' {
  return filename.toLowerCase().endsWith('.json') ? 'json' : 'csv';
}
