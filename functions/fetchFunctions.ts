app.get("/users",async (req,res) =>{
    let response = await fetch("https://jsonplaceholder.typicode.com/users");
    let data = await response.json();
    res.type("application/json");
    res.json(data);
}