import fs from 'fs';
import path from 'path';

const DATA_FILE_PATH = path.join(__dirname, '../data/users.json');

export const readUsersFile = () => {
  try {
    const data = fs.readFileSync(DATA_FILE_PATH, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading users file:', error);
    return {
      approvedUsers: [],
      pendingUsers: [],
      lastUpdate: new Date().toISOString()
    };
  }
};

export const writeUsersFile = (data) => {
  try {
    const updatedData = {
      ...data,
      lastUpdate: new Date().toISOString()
    };
    fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(updatedData, null, 2));
    return true;
  } catch (error) {
    console.error('Error writing users file:', error);
    return false;
  }
}; 