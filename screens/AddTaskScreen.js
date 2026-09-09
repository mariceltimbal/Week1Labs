import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  FlatList,
  StyleSheet,
} from 'react-native';
import { auth, db } from '../firebaseConfig';
import {
  collection,
  addDoc,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
} from 'firebase/firestore';

export default function AddTaskScreen() {
  const [taskText, setTaskText] = useState('');
  const [tasks, setTasks] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    // 1. Guard check: Do not execute query if user is not yet loaded
    const user = auth.currentUser;
    if (!user) return;

    const tasksQuery = query(
      collection(db, 'tasks'),
      where('ownerId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(
      tasksQuery,
      (snapshot) => {
        const loadedTasks = snapshot.docs.map((docItem) => ({
          id: docItem.id,
          ...docItem.data(),
        }));
        setTasks(loadedTasks);
      },
      (error) => {
        console.error('Firestore listener error:', error.message);
      }
    );

    return () => unsubscribe();
  }, []);

  async function handleAddTask() {
    if (taskText.trim() === '') {
      setErrorMessage('Please type a task before adding it.');
      return;
    }

    // 2. Guard check before saving to Firestore
    const user = auth.currentUser;
    if (!user) {
      setErrorMessage('User session not found. Please log in again.');
      return;
    }

    try {
      await addDoc(collection(db, 'tasks'), {
        title: taskText,
        done: false,
        ownerId: user.uid,
      });
      setTaskText('');
      setErrorMessage('');
    } catch (error) {
      setErrorMessage(error.message);
    }
  }

  async function handleToggleTask(id, currentDone) {
    try {
      await updateDoc(doc(db, 'tasks', id), { done: !currentDone });
    } catch (error) {
      console.error('Error toggling task:', error.message);
    }
  }

  async function handleDeleteTask(id) {
    try {
      await deleteDoc(doc(db, 'tasks', id));
    } catch (error) {
      console.error('Error deleting task:', error.message);
    }
  }

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Enter a task"
        value={taskText}
        onChangeText={setTaskText}
      />
      {errorMessage !== '' && <Text style={styles.error}>{errorMessage}</Text>}
      <Button title="Add Task" onPress={handleAddTask} />

      <FlatList
        data={tasks}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.taskCard}>
            <Text
              style={[
                styles.taskText,
                item.done && styles.taskDone,
              ]}
              onPress={() => handleToggleTask(item.id, item.done)}
            >
              {item.title}
            </Text>
            <Button title="Delete" onPress={() => handleDeleteTask(item.id)} />
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 10, marginBottom: 10, borderRadius: 5 },
  error: { color: 'red', marginBottom: 10 },
  taskCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 10, marginVertical: 5, borderWidth: 1, borderColor: '#eee' },
  taskText: { fontSize: 16 },
  taskDone: { textDecorationLine: 'line-through', color: '#888' },
});