import React, { useState } from 'react';
import { useSuiStory } from './hooks/useSuiStory';
import { ConnectButton } from '@suiet/wallet-kit';
import './App.css';

function App() {
  const { createStory, getStory, getEvents } = useSuiStory();
  const [title, setTitle] = useState('');
  const [contentHash, setContentHash] = useState('');
  const [walrusId, setWalrusId] = useState('');
  const [storyId, setStoryId] = useState('');
  const [eventType, setEventType] = useState('');
  const [result, setResult] = useState('');

  // 创建故事
  const handleCreateStory = async () => {
    setResult('');
    try {
      const res = await createStory(title, contentHash, walrusId);
      setResult(JSON.stringify(res, null, 2));
    } catch (e: any) {
      setResult(e.message || String(e));
    }
  };

  // 查询故事
  const handleGetStory = async () => {
    setResult('');
    try {
      const res = await getStory(storyId);
      setResult(JSON.stringify(res, null, 2));
    } catch (e: any) {
      setResult(e.message || String(e));
    }
  };

  // 查询事件
  const handleGetEvents = async () => {
    setResult('');
    try {
      const res = await getEvents(eventType);
      setResult(JSON.stringify(res, null, 2));
    } catch (e: any) {
      setResult(e.message || String(e));
    }
  };

  return (
    <div className="p-4 max-w-xl mx-auto">
      <ConnectButton />
      <h1 className="text-2xl font-bold mb-4">Sui Story 区块链交互测试</h1>
      <div className="mb-4">
        <h2 className="font-semibold mb-2">创建故事</h2>
        <input value={title} onChange={e => setTitle(e.target.value)} placeholder="标题" className="border p-1 mr-2" />
        <input value={contentHash} onChange={e => setContentHash(e.target.value)} placeholder="内容哈希" className="border p-1 mr-2" />
        <input value={walrusId} onChange={e => setWalrusId(e.target.value)} placeholder="Walrus ID" className="border p-1 mr-2" />
        <button onClick={handleCreateStory} className="bg-blue-500 text-white px-4 py-1 rounded">创建</button>
      </div>
      <div className="mb-4">
        <h2 className="font-semibold mb-2">查询故事</h2>
        <input value={storyId} onChange={e => setStoryId(e.target.value)} placeholder="故事ID" className="border p-1 mr-2" />
        <button onClick={handleGetStory} className="bg-green-500 text-white px-4 py-1 rounded">查询</button>
      </div>
      <div className="mb-4">
        <h2 className="font-semibold mb-2">查询事件</h2>
        <input value={eventType} onChange={e => setEventType(e.target.value)} placeholder="事件类型（如 narr_flow::token::TokensRewarded）" className="border p-1 mr-2 w-80" />
        <button onClick={handleGetEvents} className="bg-purple-500 text-white px-4 py-1 rounded">查询</button>
      </div>
      <div className="mt-6">
        <h2 className="font-semibold mb-2">结果</h2>
        <pre className="bg-gray-100 p-2 rounded text-xs max-h-96 overflow-auto">{result}</pre>
      </div>
    </div>
  );
}

export default App;
