// server.js
const express = require('express');
const mysql = require('mysql2/promise');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
app.use(bodyParser.json());
const port = 5050;

// MySQL Database Connection
// const db = mysql.createConnection({
//     host: 'localhost',
//     user: 'root',
//     password: '',
//     database: 'game'
// });

const db = {
    host: 'localhost',  // your MySQL server host
    user: 'root',       // your MySQL username
    password: '', // your MySQL password
    database: 'game', // your database name
  };
// db.connect((err) => {
//     if (err) {
//         console.error('Error connecting to the database:', err);
//     } else {
//         console.log('Connected to the database');
//     }
// });
const pool = mysql.createPool(db);

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname,'public', 'index.html'));
});

app.post('/create-teams', async (req, res) => {
    const numOfTeams = parseInt(req.body.numOfTeams, 10);
    
    if (isNaN(numOfTeams)) {
      return res.status(400).send('Invalid number of teams');
    }
  
    try {
      // Execute each database call in sequence using await
      await pool.query('CALL entry_team(?)', [numOfTeams]);
    } catch (err) {
      console.error('Error in entry_team procedure:', err);
      return res.status(500).send('Error in entry_team procedure');
    }
  
    try {
      await pool.query('CALL create_team_stats(?)', [numOfTeams]);
    } catch (err) {
      console.error('Error in create_team_stats procedure:', err);
      return res.status(500).send('Error in create_team_stats procedure');
    }
  
    try {
      await pool.query('CALL create_rental_tables_with_entries(?)', [numOfTeams]);
    } catch (err) {
      console.error('Error in create_rental_tables_with_entries procedure:', err);
      return res.status(500).send('Error in create_rental_tables_with_entries procedure');
    }
  
    res.send('Teams created successfully');
  });
  



//   try {
//     // Execute both procedures simultaneously
//     await Promise.all([
//         pool.query('CALL going_resources(?, ?, ?, ?, ?, ?)', [teamCode, army, food, ore, property, type]),
//         pool.query('CALL decrement_team_stat(?, ?, ?)', [teamCode, type, propertyCode])
//     ]);

//     // Send success response after both procedures complete
//     res.json({ message: 'Team resources deleted successfully' });
// } catch (err) {
//     console.error('Error deleting team resources:', err);
//     res.status(500).json({ message: 'Error deleting team resources' });
// }




app.post('/deleteTeamResources', async (req, res) => {
    const { teamCode, army, food, ore, property, type, propertyCode } = req.body;

    try {
    // Execute the first procedure (going_resources)
    const [goingResourcesResult] = await pool.query('CALL going_resources(?, ?, ?, ?, ?, ?)', [teamCode, army, food, ore, property, type]);

    // If the first procedure succeeds, execute the second procedure (decrement_team_stat)
    // if ( goingResourcesResult[0].ERROR_CODE === 45000) {
    //         // Handle the case when the custom error (45000) is raised
            
    //         return res.status(400).json({ message: 'User-defined error occurred (45000). First procedure failed.' });
            
    //     }
    if (goingResourcesResult) {
        // Execute the second procedure (decrement_team_stat)
        await pool.query('CALL decrement_team_stat(?, ?, ?)', [teamCode, type, propertyCode]);

        // Send success response after both procedures complete
        res.json({ message: 'Team resources deleted successfully' });
    } else {
        // If the first procedure fails, send an error response
        res.status(400).json({ message: 'Error deleting team resources (first procedure failed)' });
    }

} catch (err) {
    // Log the error and send a response
    console.error('Error deleting team resources:', err);
    res.status(500).json({ message: 'Error deleting team resources' });
}

});


// app.post('/deleteTeamResources', async (req, res) => {
//     const { teamCode, army, food, ore, property, type, propertyCode } = req.body;

//     const connection = await pool.getConnection();  // Get a connection from the pool
//     try {
//         // Start the transaction
//         await connection.beginTransaction();

//         // Execute both queries within the transaction
//         await connection.query('CALL going_resources(?, ?, ?, ?, ?, ?)', [teamCode, army, food, ore, property, type]);
//         await connection.query('CALL decrement_team_stat(?, ?, ?)', [teamCode, type, propertyCode,property]);

//         // Commit the transaction if both queries succeed
//         await connection.commit();

//         res.json({ message: 'Team resources deleted successfully' });
//     } catch (err) {
//         // If any error occurs, rollback the transaction
//         await connection.rollback();
//         console.error('Error deleting team resources:', err);
//         res.status(500).json({ message: 'Error deleting team resources' });
//     } finally {
//         // Always release the connection back to the pool
//         connection.release();
//     }
// });






app.post('/addTeamResources', async (req, res) => {
    const { teamCode, army, food, ore, property, type, propertyCode} = req.body;

    try {
        // Execute both procedures simultaneously
        await Promise.all([
            pool.query('CALL cuming_resources(?, ?, ?, ?, ?, ?)', [teamCode, army, food, ore, property, type]),
            pool.query('CALL increment_team_stat(?, ?, ?)', [teamCode, type, propertyCode])
            
        ]);

        // Send success response after both procedures complete
        res.json({ message: 'Team resources added successfully' });
    } catch (err) {
        console.error('Error adding team resources:', err);
        res.status(500).json({ message: 'Error adding team resources' });
    }
});

app.post('/rentResource', async (req, res) => {
    const { teamCode1, teamCode2, propertyType, propertyName , propertyCode} = req.body;

    try {
        // Call the rental_entry procedure
        await pool.query('CALL rental_increment_stats(?, ?, ?, ?, ?)', [teamCode1, teamCode2, propertyType, propertyName, propertyCode]);
        
        res.json({ success: true, message: 'Rental entry added successfully' });
    } catch (error) {
        console.error('Error adding rental entry:', error);
        res.status(500).json({ success: false, message: 'Error adding rental entry' });
    }
});




app.post('/reset', async (req, res) => {
    const numofTeams = parseInt(req.body.numOfTeams, 10);
    try {
        // Call the rental_entry procedure
        await pool.query('CALL create_rental_tables_with_entries(?)', [numofTeams]);
        
        res.json({ success: true, message: 'Reset' });
    } catch (error) {
        console.error('Error adding rental entry:', error);
        res.status(500).json({ success: false, message: 'Error adding rental entry' });
    }
});


app.post('/append-property', async (req, res) => {
    const teamCode = req.body.teamCode;
    const propertyName = req.body.propertyName;
    const ore = req.body.ore;
    const propertytype = req.body.type;
    const propertyCode = req.body.propertyCode;

    try {
        // Run both procedures simultaneously with Promise.all
        await Promise.all([
            pool.query('CALL append_property(?,?,?,?)', [teamCode, ore, propertyName, propertytype]),
            pool.query('CALL team_stat(?, ?,?)', [teamCode, propertyCode, propertytype])
        ]);

        // Send success response after both procedures complete
        res.send('Property added and team stats updated successfully');
    } catch (err) {
        console.error('Error executing procedures:', err);
        res.status(500).send('Database error');
    }
});



// roundwise updation;
app.post('/update-team-resources', (req, res) => {
    const { teamCode } = req.body;

    if (!teamCode) {
        return res.status(400).json({ message: 'Team code is required' });
    }

    // Call the stored procedure
    pool.query('CALL next_(?)', [teamCode], (err, results) => {
        if (err) {
            console.error('Error executing procedure:', err);
            return res.status(500).json({ message: 'Error updating team resources' });
        }

        // Optionally log results for debugging
        console.log('Procedure results:', results);

        // Check if results indicate success (depends on your procedure logic)
        if (results && results.length > 0) {
            res.json({ message: 'Team resources updated successfully' });
        } else {
            res.status(400).json({ message: 'Failed to update team resources' });
        }
    });
});



app.use(express.static('public'));

// Endpoint to get the leaderboard (team_code and ore)

// Use async/await to handle MySQL queries when using PromisePool
app.get('/getLeaderboard', async (req, res) => {
    try {
        // Run the query using async/await
        const [results] = await pool.query('SELECT team_code, ore FROM team ORDER BY ore DESC');
        res.json(results); // Send the data as a JSON response
    } catch (err) {
        console.error('Error fetching leaderboard:', err);
        res.status(500).send('Server error');
    }
});



  
app.post('/check-password', async (req, res) => {
    const { password } = req.body;
    const correctPassword = 'ram';  // Replace with your desired password

    // Check if the password is correct
    if (password === correctPassword) {
        res.json({ success: true });
    } else {
        res.json({ success: false });
    }
});

// Serve welcome.html when password is correct
app.get('/welcome', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'welcome.html'));
});
  
  // Welcome page route (the new page after login)
//   app.get('/welcome', (req, res) => {
//     res.sendFile(path.join(__dirname, 'public', 'welcome.html'));
//   });




app.get('/desk', async (req, res) => {
    try {
        // Run the query using async/await
        const [results] = await pool.query('SELECT team_code, ore ,army,food,army_properties,ore_properties,food_properties FROM team ORDER BY team_code ASC');
        res.json(results); // Send the data as a JSON response
    } catch (err) {
        console.error('Error fetching leaderboard:', err);
        res.status(500).send('Server error');
    }
});




app.post('/round-property', express.json(), async (req, res) => {
    const { propertyType } = req.body; // Expecting a JSON body like { "propertyType": "army" }

    if (!propertyType || !['army', 'food', 'ore'].includes(propertyType)) {
        return res.status(400).send('Invalid property type. Please choose from "army", "food", or "ore".');
    }

    try {
        // Call the procedure to update stats for the given property type
        await pool.query('CALL transfer_rent(?)',[propertyType]);
        await pool.query('CALL transfer_property(?)',[propertyType]);
        res.status(200).send(`Property stats for "${propertyType}" transferred successfully.`);
    } catch (error) {
        console.error(error);
        res.status(500).send('Error executing the procedure.');
    }
});

app.listen(port,'0.0.0.0',() => {
    console.log(`Server is running on http://localhost:${port}`);
});

// server.on('upgrade', (request, socket, head) => {
//     wss.handleUpgrade(request, socket, head, socket => {
//       wss.emit('connection', socket, request);
//     });
//   });
  
//   // Poll the database for changes every 5 seconds
//   setInterval(sendLeaderboardData, 5000);
