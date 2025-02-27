import React, { useState } from 'react';

const TodoItem = ({ todo, onToggle, onDelete, onEdit }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(todo.text);

  const handleEdit = () => {
    if (isEditing && editText.trim()) {
      onEdit(todo.id, editText);
    }
    setIsEditing(!isEditing);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && editText.trim()) {
      handleEdit();
    }
  };

  return (
    <div className={`todo-item ${todo.completed ? 'completed' : ''}`}>
      <input
        type="checkbox"
        checked={todo.completed}
        onChange={() => onToggle(todo.id)}
        className="todo-checkbox"
      />
      
      {isEditing ? (
        <input
          type="text"
          value={editText}
          onChange={(e) => setEditText(e.target.value)}
          onKeyPress={handleKeyPress}
          className="edit-input"
          autoFocus
        />
      ) : (
        <span className="todo-text">{todo.text}</span>
      )}
      
      <div className="todo-actions">
        <button 
          className="edit-btn"
          onClick={handleEdit}
        >
          {isEditing ? '保存' : '编辑'}
        </button>
        <button 
          className="delete-btn"
          onClick={() => onDelete(todo.id)}
        >
          删除
        </button>
      </div>
    </div>
  );
};

export default TodoItem; 