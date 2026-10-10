import React,{useEffect,useState} from 'react';
import {View,Text,FlatList,StyleSheet} from 'react-native';
import * as SQLite from 'expo-sqlite';
type Payment={id:number,name:string,phone:string,site:string,date:string,amount:number};
export default function History(){const [data,setData]=useState<Payment[]>([]);useEffect(()=>{(async()=>{const db=await SQLite.openDatabaseAsync('rk.db');setData(await db.getAllAsync<Payment>('SELECT * FROM payments ORDER BY id DESC'))})()},[]);return <FlatList style={s.page} contentContainerStyle={{padding:16}} data={data} keyExtractor={r=>String(r.id)} ListEmptyComponent={<Text>No payments saved yet.</Text>} renderItem={({item})=><View style={s.card}><Text style={s.name}>{item.name} · ₹{item.amount.toLocaleString('en-IN')}</Text><Text>{item.site} · {item.date}</Text><Text>{item.phone}</Text></View>}/>}
const s=StyleSheet.create({page:{flex:1,backgroundColor:'#f7f7f7'},card:{backgroundColor:'#fff',padding:18,borderRadius:12,marginBottom:10,gap:6},name:{fontWeight:'bold',fontSize:17}});
