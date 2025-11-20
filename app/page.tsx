"use client";
import React, { useState, useEffect, useRef } from "react";

import { insertUserRow, saveGameState, getGameState } from './supabase-services';

type Card = { id: number; image: string }; 
interface GameState { 
  deck: Card[]; 
  matched: number[]; 
  flipped: number[];
  moves: number; 
  images: string[];
 }
 


export default function MemoryGame() {
  const defaultImages = ["😊", "😂", "🤣", "❤️", "😍", "😒", "👌", "😘"];
  const [images, setImages] = useState(defaultImages.slice(0, 8));
  const [deck, setDeck] = useState(buildDeck(images));
  const [matched, setMatched] = useState<number[]>([]);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [isWinner, setIsWinner] = useState(false);
  const [userName, setUserName] = useState("");
  const [userID, setUserID] = useState<number | null>(null);
  const [showNameInput, setShowNameInput] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [loadedGame, setLoadedGame] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const firstIndex = useRef<number | null>(null);
  const lockBoard = useRef(false);

  function buildDeck(images: string[]) {
    const pairs = images.flatMap((image, i) => [
      { id: i * 2, image },
      { id: i * 2 + 1, image }
    ]);
    return pairs
      .map(v => ({ v, sort: Math.random() }))
      .sort((a, b) => a.sort - b.sort)
      .map(({ v }) => v);
  }

  useEffect(() => {
    if (matched.length === deck.length && deck.length > 0) {
      setIsWinner(true);
    }
  }, [matched, deck]);

  async function handleNameSubmit() {
    if (!userName.trim()) return;
    
    setIsLoading(true);
    try {
      const id = await insertUserRow(userName.trim());
      if (id) {
        setUserID(id);
        
        const savedState = (await getGameState(id)) as
          | {
              deck?: { id: number; image: string }[];
              matched?: number[];
              flipped?: number[];
              moves?: number;
              images?: string[];
            }
          | null;

        if (savedState && savedState.deck && savedState.deck.length > 0) {
          setDeck(savedState.deck);
          setMatched(savedState.matched ?? []);
          setFlipped(savedState.flipped ?? []);
          setMoves(savedState.moves ?? 0);
          setImages(savedState.images ?? defaultImages.slice(0, 8));
          setLoadedGame(true);
        }
        
        setShowNameInput(false);
      }
    } catch (error) {
      console.error("Error creating user:", error);
    } finally {
      setIsLoading(false);
    }
  }
  // Placeholder to avoid TS error

  async function handleSaveGame() {
    if (!userID) return;
    
    setIsSaving(true);
    try {
      await saveGameState(userID, {
        deck,
        matched,
        flipped,
        moves,
        images
      });
      
      // Show success feedback
      setTimeout(() => setIsSaving(false), 1000);
    } catch (error) {
      console.error("Error saving game:", error);
      setIsSaving(false);
    }
  }

  async function handleTileClick(index: number) {
    if (lockBoard.current) return;
    if (flipped.includes(index) || matched.includes(index)) return;
    
    if (firstIndex.current === null) {
      firstIndex.current = index;
      setFlipped(prev => [...prev, index]);
    } else {
      const secondIndex = index;
      setFlipped(prev => [...prev, secondIndex]);
      setMoves(prev => prev + 1);
      lockBoard.current = true;
      
      const firstImage = deck[firstIndex.current].image;
      const secondImage = deck[secondIndex].image;
      
      if (firstImage === secondImage) {
        setMatched(prev => [...prev, firstIndex.current!, secondIndex]);
        resetTurn();
      } else {
        const firstIdx = firstIndex.current;
        setTimeout(() => {
          setFlipped(prev =>
            prev.filter(i => i !== firstIdx && i !== secondIndex)
          );
          resetTurn();
        }, 1000);
      }
    }
  }

  function resetTurn() {
    firstIndex.current = null;
    lockBoard.current = false;
  }

  function newGame() {
    setImages(defaultImages.slice(0, 8));
    setDeck(buildDeck(defaultImages.slice(0, 8)));
    setMatched([]);
    setFlipped([]);
    setMoves(0);
    setIsWinner(false);
    setLoadedGame(false);
    firstIndex.current = null;
    lockBoard.current = false;
    handleSaveGame();
    }

  function logout() {
    setUserName("");
    setUserID(null);
    setShowNameInput(true);
    newGame();
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleNameSubmit();
    }
  };

  if (showNameInput) {
    return (
      <div className="min-h-screen bg-linear-to-br from-purple-500 via-pink-500 to-red-500 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
          <div className="text-center mb-6">
            <div className="text-6xl mb-4">🧠</div>
            <h1 className="text-3xl font-bold text-purple-600 mb-2">
              Memory Game
            </h1>
            <p className="text-black">Enter your name to start playing</p>
          </div>
          
          <div className="space-y-4">
            <div>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Your name"
                className="w-full px-4 py-3 text-black rounded-lg border-2 border-purple-300 focus:border-purple-500 focus:outline-none text-lg"
                disabled={isLoading}
                autoFocus
              />
            </div>
            
            <button
              onClick={handleNameSubmit}
              disabled={!userName.trim() || isLoading}
              className="w-full bg-linear-to-r from-purple-500 to-pink-500 text-white font-bold px-6 py-3 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isLoading ? "Loading..." : "Start Game"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-purple-500 via-pink-500 to-red-500 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-8">
          <div className="flex justify-between items-center mb-4">
            <div className="text-white text-lg font-semibold">
              Hello, {userName}! 👋
            </div>
            <button
              onClick={logout}
              className="text-white bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full hover:bg-white/30 transition-all text-sm font-semibold"
            >
              Logout
            </button>
          </div>
          
          <h1 className="text-5xl font-bold text-white mb-4 drop-shadow-lg">
            🧠 Memory Game
          </h1>
          
          {loadedGame && (
            <div className="bg-green-400 text-white px-4 py-2 rounded-full inline-block mb-4 text-sm font-semibold">
              ✓ Game loaded from last session
            </div>
          )}
          
          <div className="flex justify-center gap-8 text-white">
            <div className="bg-white/20 backdrop-blur-sm px-6 py-3 rounded-full">
              <span className="text-sm font-semibold">Moves</span>
              <div className="text-2xl font-bold">{moves}</div>
            </div>
            <div className="bg-white/20 backdrop-blur-sm px-6 py-3 rounded-full">
              <span className="text-sm font-semibold">Matched</span>
              <div className="text-2xl font-bold">
                {matched.length / 2} / {deck.length / 2}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-3 mb-6">
          {deck.map((card, index) => {
            const isFlipped = flipped.includes(index);
            const isMatched = matched.includes(index);
            const showFace = isFlipped || isMatched;

            return (
              <button
                key={card.id}
                onClick={() => handleTileClick(index)}
                disabled={isMatched}
                className={`aspect-square rounded-xl transition-all duration-300 transform hover:scale-105 ${
                  isMatched
                    ? "bg-green-400 scale-95 cursor-default"
                    : showFace
                    ? "bg-white"
                    : "bg-white/30 backdrop-blur-sm hover:bg-white/40"
                } shadow-lg`}
              >
                <div
                  className={`w-full h-full flex items-center justify-center text-4xl transition-all duration-300 ${
                    showFace ? "opacity-100 scale-100" : "opacity-0 scale-50"
                  }`}
                >
                  {showFace ? card.image : ""}
                </div>
              </button>
            );
          })}
        </div>

        <div className="flex justify-center gap-4">
          <button
            onClick={handleSaveGame}
            disabled={isSaving}
            className="bg-blue-500 text-white font-bold px-8 py-3 rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {isSaving ? "✓ Saved!" : "💾 Save Game"}
          </button>
          <button
            onClick={newGame}
            className="bg-white text-purple-600 font-bold px-8 py-3 rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
          >
            🔄 New Game
          </button>
        </div>

        {isWinner && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-8 max-w-md mx-4 text-center transform animate-bounce">
              <div className="text-6xl mb-4">🎉</div>
              <h2 className="text-3xl font-bold text-purple-600 mb-2">
                Congratulations, {userName}!
              </h2>
              <p className="text-gray-600 mb-6">
                You won in <span className="font-bold">{moves}</span> moves!
              </p>
              <button
                onClick={newGame}
                className="bg-linear-to-r from-purple-500 to-pink-500 text-white font-bold px-8 py-3 rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
              >
                Play Again
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}