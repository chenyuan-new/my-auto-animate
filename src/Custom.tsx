import { useEffect, useRef, useState } from 'react';
import { autoAnimate } from './lib/my-animate';
import './App.css';

const App = () => {
  const [showList, setShowList] = useState(true);
  const [items, setItems] = useState(['🍎 Apple']);
  const runRef = useRef(false);
  const [fruitBasket, setFruitBasket] = useState([
    '🍓 Strawberry',
    '🥥 Coconut',
    '🥝 Kiwi',
    '🍇 Grape',
    '🍉 Watermelon',
    '🍍 Pineapple',
    '🍐 Pear',
    '🍑 Peach',
    '🍌 Banana',
    '🍒 Cherry',
    '🫐 Blueberry',
    '🍊 Orange',
    '🥭 Mango',
  ]);

  const listRef = useRef<HTMLUListElement>(null);
  useEffect(() => {
    if (runRef.current) return;
    if (listRef.current) {
      runRef.current = true;
      autoAnimate(listRef.current as HTMLElement, {
        duration: 250,
        easing: 'ease-in-out',
      });
    }
  }, []);

  const sortItems = () => {
    setItems([...items].sort(() => (Math.random() > 0.5 ? 1 : -1)));
  };

  const remove = (item: string) => {
    setItems(items.filter((fruit) => fruit !== item));
    setFruitBasket([...fruitBasket, item]);
  };

  const add = () => {
    if (fruitBasket.length) {
      const randomIndex = Math.round(Math.random() * items.length);
      const [newFruit, ...remainingFruits] = fruitBasket;

      setItems([
        ...items.slice(0, randomIndex),
        newFruit,
        ...items.slice(randomIndex),
      ]);
      setFruitBasket(remainingFruits);
    } else {
      alert('Out of fruit!');
    }
  };

  const replace = () => {
    if (fruitBasket.length) {
      const randomIndex = Math.round(Math.random() * (items.length - 1));
      const [newFruit, ...remainingFruits] = fruitBasket;
      const removedFruit = items[randomIndex];

      const newItems = [...items];
      newItems[randomIndex] = newFruit;

      setItems(newItems);
      setFruitBasket([...remainingFruits, removedFruit]);
    } else {
      alert('Out of fruit!');
    }
  };

  return (
    <div className="content">
      {showList && (
        <ul ref={listRef}>
          {items.map((item) => (
            <li key={item}>
              <span>{item}</span>
              <button onClick={() => remove(item)}>Remove</button>
            </li>
          ))}
        </ul>
      )}

      <button onClick={sortItems}>Random Sort</button>
      <button onClick={add}>Add Fruit</button>
      <button onClick={replace}>Replace Fruit</button>
      <button onClick={() => setShowList(!showList)}>Toggle List</button>
    </div>
  );
};

export default App;
