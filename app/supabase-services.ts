import{supabase}from'./supabase-client';
export async function insertUserRow(name: string) {
  const { data: existingUser, error: fetchError } = await supabase
    .from("users")
    .select("id")
    .eq("name", name)
    .single();

  if (existingUser) {
    return existingUser.id;
  }

  if (fetchError && fetchError.code !== "PGRST116") {
    console.error("Error checking user:", fetchError);
    return null;
  }

  const { data, error } = await supabase
    .from("users")
    .insert({
      name,
      deck: "[]",
      matched: "[]",
      flipped: "[]",
      moves: 0,
      images: "[]",
    })
    .select("id")
    .single();

  if (error) {
    console.error("Error inserting user:", error);
    return null;
  }

  return data.id;
}

export async function saveGameState(userID:Number,{
    deck,
    matched,
    flipped,
    moves,
    images
}:{
    deck:any[],
    matched:number[],
    flipped:number[],
    moves:number,
    images:string[]
}){
    const{data,error}=await supabase.from('users').update({
        deck:JSON.stringify(deck),
        matched:JSON.stringify(matched),
        flipped:JSON.stringify(flipped),
        moves,
        images:JSON.stringify(images)
    }).eq('id',userID);
    if(error){
        console.error("Error saving game state:",error);
    }
}
export async function getGameState(userID:Number){
    const{data,error}=await supabase.from('users').select('*').eq('id',userID).single();
    if(error){
        console.error("Error fetching game state:",error);
        return null;
    }   
    return {
        deck:JSON.parse(data.deck),
        matched:JSON.parse(data.matched),
        flipped:JSON.parse(data.flipped),
        moves:data.moves,
        images:JSON.parse(data.images)
    };
}
