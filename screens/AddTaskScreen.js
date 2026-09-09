import { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, FlatList, StyleSheet } from 'react-native';
import { signOut } from 'firebase/auth';
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
    // Guard against null auth user during startup or hot reload
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    const tasksQuery = query(
      collection(db, 'tasks'),
      where('ownerId', '==', currentUser.uid)
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
      (err) => setErrorMessage(err.message)
    );

    return () => unsubscribe();
  }, []);

  async function handleAddTask() {
    if (taskText.trim() === '') {
      setErrorMessage('Please type a task before adding it.');
      return;
    }

    const currentUser = auth.currentUser;
    if (!currentUser) {
      setErrorMessage('User session not active.');
      return;
    }

    try {
      await addDoc(collection(db, 'tasks'), {
        title: taskText,
        done: false,
        ownerId: currentUser.uid,
      });
      setTaskText('');
      setErrorMessage('');
    } catch (err) {
      setErrorMessage(err.message);
    }
  }

  async function handleToggleTask(id, currentDone) {
    try {
      await updateDoc(doc(db, 'tasks', id), { done: !currentDone });
    } catch (err) {
      setErrorMessage(err.message);
    }
  }

  async function handleDeleteTask(id) {
    try {
      await deleteDoc(doc(db, 'tasks', id));
    } catch (err) {
      setErrorMessage(err.message);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.userText}>User: {auth.currentUser?.email}</Text>
        <Button title="Log Out" color="#B23A48" onPress={() => signOut(auth)} />
      </View>

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
              style={[styles.taskText, item.done && styles.taskDone]}
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
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  userText: { fontSize: 12, color: '#555' },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 10, marginBottom: 10, borderRadius: 5 },
  error: { color: '#B23A48', marginBottom: 10 },
  taskCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 10, marginVertical: 5, borderWidth: 1, borderColor: '#eee' },
  taskText: { fontSize: 16 },
  taskDone: { textDecorationLine: 'line-through', color: '#888' },
});