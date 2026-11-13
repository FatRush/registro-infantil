import { Component, CUSTOM_ELEMENTS_SCHEMA, NgZone, inject } from '@angular/core';

import { collection, addDoc, onSnapshot, deleteDoc, doc, updateDoc } from 'firebase/firestore';

import { db } from '../services/firebase.config';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  standalone: true,
  imports: [
  ]
})
export class HomePage {
  
  private ngZone = inject(NgZone);

  segmentoActivo: string = 'registrar';

  // Datos para niños
  nino = {
    nombre: '',
    edad: null as number | string | null,
    papa: '',
    telefono: '',
    observaciones: ''
  };

  listaNinos: any[] = [];
  totalNinos: number = 0;
  editandoId: string | null = null;

  // NUEVO: Datos y lista para servidores / guías
  servidor = {
    nombre: '',
    grupo: ''
  };

  listaServidores: any[] = [];
  editandoServidorId: string | null = null;

  filtroNinos: string = '';
  filtroServidores: string = '';

  constructor() {
    this.cargarDatosTiempoReal();
    this.cargarServidoresTiempoReal(); // NUEVO: Cargar servidores al iniciar
  }

  segmentChanged(event: any): void {
    this.segmentoActivo = event.detail.value;
    if (this.segmentoActivo === 'lista') {
      this.cargarDatosTiempoReal();
    } else if (this.segmentoActivo === 'servidores') {
      this.cargarServidoresTiempoReal();
    }
  }

  // ==================== CRUD NIÑOS ====================
  
  get totalHoy(): number {
    const hoy = new Date().toDateString();
    return this.listaNinos.filter(item => {
      if (!item.fecha) return false;
      const fechaItem = item.fecha.toDate ? item.fecha.toDate() : new Date(item.fecha);
      return fechaItem.toDateString() === hoy;
    }).length;
  }

  cargarParaEditar(item: any): void {
    this.nino = {
      nombre: item.nombre,
      edad: item.edad,
      papa: item.papa,
      telefono: item.telefono,
      observaciones: item.observaciones || ''
    };
    this.editandoId = item.id;
    this.segmentoActivo = 'registrar';
  }

  async registrarNino(): Promise<void> {
    const edadNum = Number(this.nino.edad);

    if (!this.nino.nombre || !this.nino.papa || !this.nino.telefono || isNaN(edadNum) || edadNum <= 0) {
      alert('Faltan datos obligatorios. Por favor llena todos los campos marcados con *');
      return;
    }

    try {
      if (this.editandoId) {
        const docRef = doc(db, 'ninos', this.editandoId);
        await updateDoc(docRef, {
          nombre: this.nino.nombre,
          edad: edadNum,
          papa: this.nino.papa,
          telefono: this.nino.telefono,
          observaciones: this.nino.observaciones || ''
        });
        alert('Registro actualizado correctamente.');
      } else {
        await addDoc(collection(db, 'ninos'), {
          nombre: this.nino.nombre,
          edad: edadNum,
          papa: this.nino.papa,
          telefono: this.nino.telefono,
          observaciones: this.nino.observaciones || '',
          activo: true, 
          fecha: new Date()
        });
        alert('Registro guardado correctamente.');
      }

      this.nino = { nombre: '', edad: null, papa: '', telefono: '', observaciones: '' };
      this.editandoId = null;
      this.segmentoActivo = 'lista';
    } catch (error) {
      console.error('Error al guardar: ', error);
      alert('Hubo un error al procesar la operación en Firebase.');
    }
  }

  async toggleActivo(item: any): Promise<void> {
    const nuevoEstado = !item.activo;
    const estadoAnterior = item.activo;

    this.ngZone.run(() => {
      this.listaNinos = this.listaNinos.map(n => {
        if (n.id === item.id) {
          return { ...n, activo: nuevoEstado };
        }
        return n;
      });
    });

    try {
      const docRef = doc(db, 'ninos', item.id);
      await updateDoc(docRef, { activo: nuevoEstado });
    } catch (error) {
      console.error('Error al cambiar el estado en Firebase:', error);
      this.ngZone.run(() => {
        this.listaNinos = this.listaNinos.map(n => {
          if (n.id === item.id) {
            return { ...n, activo: estadoAnterior };
          }
          return n;
        });
      });
      alert('No se pudo actualizar el estado en la base de datos.');
    }
  }

  get totalActivos(): number {
    return this.listaNinos.filter(item => item.activo === true).length;
  }

  cargarDatosTiempoReal(): void {
    onSnapshot(collection(db, 'ninos'), (snapshot) => {
      this.ngZone.run(() => {
        const temporales: any[] = [];
        snapshot.forEach((docSnap) => {
          temporales.push({
            id: docSnap.id,
            ...docSnap.data()
          });
        });
        this.listaNinos = temporales;
        this.totalNinos = this.listaNinos.length;
      });
    });
  }

  trackById(index: number, item: any): string {
    return item.id;
  }

  async eliminar(id: string): Promise<void> {
    if (confirm('¿Estás seguro de eliminar este registro?')) {
      try {
        this.ngZone.run(() => {
          this.listaNinos = this.listaNinos.filter(item => item.id !== id);
          this.totalNinos = this.listaNinos.length;
        });
        await deleteDoc(doc(db, 'ninos', id));
      } catch (error) {
        console.error('Error al eliminar:', error);
        alert('Hubo un error al eliminar el registro.');
        this.cargarDatosTiempoReal();
      }
    }
  }

  // ==================== CRUD SERVIDORES ====================

  cargarServidoresTiempoReal(): void {
    onSnapshot(collection(db, 'servidores'), (snapshot) => {
      this.ngZone.run(() => {
        const temporales: any[] = [];
        snapshot.forEach((docSnap) => {
          temporales.push({
            id: docSnap.id,
            ...docSnap.data()
          });
        });
        this.listaServidores = temporales;
      });
    });
  }

  async guardarServidor(): Promise<void> {
    if (!this.servidor.nombre || !this.servidor.grupo) {
      alert('Por favor completa todos los campos obligatorios del servidor.');
      return;
    }

    try {
      if (this.editandoServidorId) {
        const docRef = doc(db, 'servidores', this.editandoServidorId);
        await updateDoc(docRef, {
          nombre: this.servidor.nombre,
          grupo: this.servidor.grupo
        });
        alert('Servidor actualizado correctamente.');
      } else {
        await addDoc(collection(db, 'servidores'), {
          nombre: this.servidor.nombre,
          grupo: this.servidor.grupo,
          fecha: new Date()
        });
        alert('Servidor guardado correctamente.');
      }

      this.servidor = { nombre: '', grupo: '' };
      this.editandoServidorId = null;
    } catch (error) {
      console.error('Error al guardar servidor:', error);
      alert('Hubo un error al procesar el servidor en Firebase.');
    }
  }

  cargarServidorParaEditar(item: any): void {
    this.servidor = {
      nombre: item.nombre,
      grupo: item.grupo
    };
    this.editandoServidorId = item.id;
  }

  async eliminarServidor(id: string): Promise<void> {
    if (confirm('¿Estás seguro de eliminar este servidor?')) {
      try {
        this.ngZone.run(() => {
          this.listaServidores = this.listaServidores.filter(item => item.id !== id);
        });
        await deleteDoc(doc(db, 'servidores', id));
      } catch (error) {
        console.error('Error al eliminar servidor:', error);
        alert('Hubo un error al eliminar el servidor.');
        this.cargarServidoresTiempoReal();
      }
    }
  }

  get listaNinosFiltrada(): any[] {
    if (!this.filtroNinos.trim()) {
      return this.listaNinos;
    }
    return this.listaNinos.filter(item => 
      item.nombre.toLowerCase().includes(this.filtroNinos.toLowerCase()) ||
      item.papa.toLowerCase().includes(this.filtroNinos.toLowerCase())
    );
  }

  // Getter para filtrar la lista de servidores en tiempo real
  get listaServidoresFiltrada(): any[] {
    if (!this.filtroServidores.trim()) {
      return this.listaServidores;
    }
    return this.listaServidores.filter(item => 
      item.nombre.toLowerCase().includes(this.filtroServidores.toLowerCase()) ||
      item.grupo.toLowerCase().includes(this.filtroServidores.toLowerCase())
    );
  }
}