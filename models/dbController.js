//This is a node application to show the database working.

/*TODO:change "sample_user" to official db name wherever it is used
establish db connection on app launch
securely create uri
addBook function to update collection
*/
const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config();

//addUser creates a user from an object {name: ..., hashedpassword: ... , collection:[...]}
async function addUser(client, newUser){
    const result = await client.db("sample_user").collection("Users").insertOne(newUser);

    console.log(`New user created with id: '${result.insertedId}'`)
}

//findUser function to check db for a given username
async function findUser(client, user){
    const result = await client.db("sample_user").collection("Users").findOne({name: user});

    if(result){
        console.log(`Found user '${user}':`);
        return result;
    }else{
        console.log(`No user found with name '${user}'`);
    }
}

//deleteUser deletes a user based on the name given
async function deleteUser(client, user){
    const result = await client.db("sample_user").collection("Users").deleteOne({name: user});

    console.log(`'${result.deletedCount}' user(s) deleted`);
}

//run function runs all of the db functions in sequence for testing purposes 
async function run() {
    const uri = process.env.MONGO_URI;

    const client = new MongoClient(uri, {
        serverAPI:{
            version:ServerApiVersion.v1,
            strict: true,
            deprecationErrors: true,
        }
    });

    try {
        //connect to client
        await client.connect();
        console.log("Connected!");


        await addUser(client, {name: "Dylan", hashedpassword: "DH123", collection: []});

        let foundUser = await findUser(client, "Dylan");
        console.log(foundUser);

        await deleteUser(client, "Dylan");
        await findUser(client, "Dylan");


    }catch (e){
        console.error(e);
    }finally{
        //disconnect from client
        await client.close();
        console.log("Disconnected!");
    }
    
}

run().catch(console.error);