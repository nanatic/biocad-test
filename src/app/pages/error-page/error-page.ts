import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-error-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './error-page.html',
  styleUrl: './error-page.scss',
})
export class ErrorPage {}
