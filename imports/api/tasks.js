import { Mongo } from 'meteor/mongo';
import { check } from 'meteor/check';
import { Meteor } from 'meteor/meteor';
 
export const Tasks = new Mongo.Collection('tasks');

if (Meteor.isServer) {
   // Ce code ne fonctionne que sur le serveur
  Meteor.publish('tasks', tasksPublication =()=> {
    return Tasks.find({
      $or: [
        { private: { $ne: true } },
        { owner: this.userId },
      ],
    });
  });
}
 
Meteor.methods({
    'tasks.insert'(text) {
      check(text, String);
   
       // Assurez-vous que l'utilisateur est connecté avant d'insérer une tâche
      if (!this.userId) {
        throw new Meteor.Error('not-authorized');
      }
   
      Tasks.insert({
        text,
        createdAt: new Date(),
        owner: this.userId,
        username: Meteor.users.findOne(this.userId).username,
      });
    },
    'tasks.remove'(taskId) {
      check(taskId, String);
      const task = Tasks.findOne(taskId);
      if (task.private && task.owner !== this.userId) {
         // Si la tâche est privée, assurez-vous que seul le propriétaire peut la supprimer
        throw new Meteor.Error('not-authorized');
      }
      Tasks.remove(taskId);
    },
    'tasks.setChecked'(taskId, setChecked) {
      check(taskId, String);
      check(setChecked, Boolean);
      const task = Tasks.findOne(taskId);
      if (task.private && task.owner !== this.userId) {
        // Si la tâche est privée, assurez-vous que seul le propriétaire peut la cocher
        throw new Meteor.Error('not-authorized');
      }
   
      Tasks.update(taskId, { $set: { checked: setChecked } });
    },
    'tasks.setPrivate'(taskId, setToPrivate) {
      check(taskId, String);
      check(setToPrivate, Boolean);
   
      const task = Tasks.findOne(taskId);
   
      // Make sure only the task owner can make a task private
      if (task.owner !== this.userId) {
        throw new Meteor.Error('not-authorized');
      }
   
      Tasks.update(taskId, { $set: { private: setToPrivate } });
    },
  });