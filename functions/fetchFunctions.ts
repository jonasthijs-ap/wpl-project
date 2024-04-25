app.get("/users",async (req,res) =>{
    let response = await fetch("https://rebrickable.com/api/v3/lego/minifigs");
    let data = await response.json();
    res.type("application/json");
    res.json(data);
}