const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require("path");
const connectDB = require('./config/database');
const dotenv = require('dotenv');
const multer = require('multer');
const xlsx = require('xlsx');



dotenv.config();

connectDB();
// Import models
const Person = require("./models/person");
const Attendance = require("./models/attendance");
// const Leave = require("./models/leave");
// const Login = require("./models/login");


const app = express();


app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
// Middleware untuk menyediakan default values
app.use((req, res, next) => {
  res.locals.person = null;
  res.locals.persons = [];
  next();
});


app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "/views"));

app.get('/attendance', (req, res) => {
  res.render('attendance');
});

app.get('/daily', (req, res) => {
  res.render('daily-attendance');
});

app.get('/list', (req, res) => {
  res.render('dashboard');
});

app.get('/scan-qr', (req, res) => {
  res.render('scanqr');
});

app.get('/addEmployee', (req, res) => {
  res.render('addEmployee');
})
app.get("/person", async (req, res) => {
  try {
    const data = await Person.find({});
    
    // Jika request adalah AJAX (dari DataTables)
    if (req.xhr || req.headers.accept.indexOf('json') > -1) {
      return res.json(data);
    }
    
    // Jika regular request, render EJS template
    res.render('person-dashboard');
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: "Error fetching data" });
  }
});

app.get('/scan-qr', (req, res) => {
  res.render('scan-qr');
});

app.post('/submit-qr', async (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ success: false, message: 'Token tidak valid' });
  }

  try {
    const person = await Person.findOne({ token });
    if (!person) {
      return res.status(400).json({ success: false, message: 'Token tidak ditemukan' });
    }

    const present_date = new Date().toLocaleDateString("en-GB");

    // Check if the person has already checked in today
    const existingAttendance = await Attendance.findOne({ token, present_date });
    if (existingAttendance) {
      return res.status(400).json({ 
        success: false, 
        message: `Anda sudah absen hari ini, ${person.name}` 
      });
    }

    const time = new Date().toLocaleTimeString("en-GB");

    const attendance = await Attendance.create({
      present_date,
      token,
      join_time: time,
      exit_time: null,
      status: false
    });

    res.json({ 
      success: true, 
      user: {
        name: person.name,
        dept_name: person.dept_name,
        phone: person.phone
      },
      attendance: {
        join_time: time,
        present_date: present_date
      }
    });
  } catch (error) {
    // Error handling tetap sama seperti sebelumnya
    if (error.name === 'ValidationError') {
      console.error("Validation Error:", error);
      return res.status(400).json({ success: false, message: 'Validation Error' });
    } else if (error.name === 'MongoError') {
      console.error("MongoDB Error:", error);
      return res.status(500).json({ success: false, message: 'Database Error' });
    } else {
      console.error("Unknown Error:", error);
      return res.status(500).json({ success: false, message: 'Kesalahan server' });
    }
  }
});




app.post("/token", async function (req, res) {
  const { present_date, token, time, entry_name } = req.body;

  if (!Number.isInteger(token) || token <= 0) {
    return res.status(400).json({ type: "invaltoken_token_format" });
  }

  try {
    const person = await Person.findOne({ token });
    if (!person) {
      return res.status(400).json({ type: "invalid token_token" });
    }

    if (entry_name === "join_time") {
      await Attendance.create({
        present_date,
        token,
        join_time: time,
        exit_time: null,
        status: false
      });
      res.json({ type: "join_time_ok" });
    } else if (entry_name === "exit_time") {
      await Attendance.findOneAndUpdate(
        { token, present_date, exit_time: null },
        {
          exit_time: time,
          status: true
        }
      );
      res.json({ type: "exit_time_ok" });
    } else {
      res.json({ type: "done" });
    }
  } catch (error) {
    res.status(500).json({ error: "Database operation failed" });
  }
});


app.post("/deletePresent", async (req, res) => {
  const { token, present_date } = req.body;

  try {
    await Attendance.deleteOne({ token, present_date });
    res.json({ type: "deletePresent_done" });
  } catch (error) {
    res.status(500).json({ type: "deletePresent_error" });
  }
});

app.post("/add-attendance", async (req, res) => {
  let { present_date, token } = req.body;
  let userDate = present_date ? new Date(present_date).toLocaleDateString("en-GB") : null;
  token = +token;

  try {
    const person = await Person.findOne({ token });
    if (!person) {
      return res.status(400).json({ type: "invaltoken_token" });
    }

    const existingAttendance = await Attendance.findOne({ present_date: userDate, token });
    if (existingAttendance) {
      return res.status(400).json({ type: "attendance_exists" });
    }

    await Attendance.create({
      present_date: userDate,
      token,
      join_time: "08:00:00",
      exit_time: "17:00:00",
      status: true
    });
    res.json({ type: "addPresent_done" });
  } catch (error) {
    res.json({ type: "addPresent_error" });
  }
});

app.post("/addEmployee", async (req, res) => {
  const { token, name, dept_name, phone, salary, role } = req.body;

  try {
    // Cek apakah token sudah ada
    const existingPerson = await Person.findOne({ token });
    if (existingPerson) {
      return res.status(400).json({ 
        type: "addEmployee_duplicate", 
        message: "Token sudah digunakan" 
      });
    }

    // Buat pegawai baru
    const newPerson = await Person.create({
      token: +token,
      name,
      dept_name,
      phone,
      salary,
      role
    });
    
    res.json({ 
      type: "addEmployee_done",
      data: newPerson 
    });
  } catch (error) {
    console.error("Add Employee Error:", error);
    
    if (error.code === 11000) {
      return res.status(400).json({ 
        type: "addEmployee_duplicate", 
        message: "Token sudah digunakan" 
      });
    }

    return res.status(500).json({ 
      type: "addEmployee_unknown_error", 
      message: 'Kesalahan server',
      error: error.message 
    });
  }
});

app.get("/attendanceList", async (req, res) => {
  try {
    const data = await Attendance.aggregate([
      {
        $lookup: {
          from: 'people',
          localField: 'token',
          foreignField: 'token',
          as: 'person_info'
        }
      },
      {
        $unwind: {
          path: "$person_info",
          preserveNullAndEmptyArrays: true
        }
      }
    ]);
    
    if (req.xhr || req.headers.accept.indexOf('json') > -1) {
      return res.json(data);
    }
    res.render('dashboard');
  } catch (error) {
    console.error('Error:', error); // Add this for debugging
    res.status(500).json({ error: "Error fetching data" });
  }
});

app.post("/updateEmployee", async (req, res) => {
  const { token, name, dept_name, phone, salary, role } = req.body;

  try {
    const result = await Person.updateOne(
      { token: +token },
      {
        name,
        dept_name,
        phone,
        salary: +salary,
        role
      }
    );

    if (result.modifiedCount > 0) {
      res.json({ 
        type: "updateEmployee_done",
        message: "Employee updated successfully" 
      });
    } else {
      res.status(404).json({ 
        type: "updateEmployee_notfound", 
        message: "Employee not found" 
      });
    }
  } catch (error) {
    console.error("Update Employee Error:", error);
    res.status(500).json({ 
      type: "updateEmployee_error",
      message: "Error updating employee" 
    });
  }
});

// Konfigurasi multer untuk upload file
const upload = multer({ 
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, 'uploads/') // Pastikan folder uploads sudah ada
    },
    filename: (req, file, cb) => {
      cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname))
    }
  }),
  fileFilter: (req, file, cb) => {
    // Validasi tipe file Excel
    const extname = path.extname(file.originalname).toLowerCase();
    if (extname === '.xlsx' || extname === '.xls' || extname === '.csv') {
      cb(null, true);
    } else {
      cb(new Error('Hanya file Excel yang diperbolehkan!'), false);
    }
  }
});

app.post('/import-employees', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ type: 'import_no_file', message: 'Tidak ada file yang diunggah' });
    }

    // Baca file Excel
    const workbook = xlsx.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Konversi worksheet ke JSON
    const employees = xlsx.utils.sheet_to_json(worksheet);

    // Validasi struktur data
    const requiredFields = ['token', 'name', 'dept_name', 'phone', 'salary', 'role'];
    const invalidRows = employees.filter(emp => 
      !requiredFields.every(field => emp.hasOwnProperty(field))
    );

    if (invalidRows.length > 0) {
      return res.status(400).json({ 
        type: 'import_invalid_data', 
        message: 'Beberapa baris data tidak lengkap',
        invalidRows: invalidRows
      });
    }

    // Proses import
    const importResults = {
      successful: [],
      duplicates: [],
      errors: []
    };

    for (const emp of employees) {
      try {
        // Cek apakah token sudah ada
        const existingPerson = await Person.findOne({ token: +emp.token });
        
        if (existingPerson) {
          importResults.duplicates.push(emp);
          continue;
        }

        // Buat pegawai baru
        const newPerson = await Person.create({
          token: +emp.token,
          name: emp.name,
          dept_name: emp.dept_name,
          phone: emp.phone,
          salary: +emp.salary,
          role: emp.role
        });

        importResults.successful.push(newPerson);
      } catch (error) {
        importResults.errors.push({ employee: emp, error: error.message });
      }
    }

    res.json({
      type: 'import_complete',
      summary: {
        total: employees.length,
        successful: importResults.successful.length,
        duplicates: importResults.duplicates.length,
        errors: importResults.errors.length
      },
      details: importResults
    });

  } catch (error) {
    console.error('Import Error:', error);
    res.status(500).json({ 
      type: 'import_error', 
      message: 'Gagal mengimpor data',
      error: error.message 
    });
  }
});


app.listen(3001, () => {
  console.log("app is running on port 3001");
});