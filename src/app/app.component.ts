import { Component, inject, signal, OnInit } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { LinksService, Link } from './links.service';

@Component({
  selector: 'app-root',
  imports: [FormsModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent implements OnInit {
  private svc = inject(LinksService);

  urlInput = '';
  readonly error = signal('');
  readonly lastLink = signal<Link | null>(null);
  readonly links = signal<Link[]>([]);
  readonly loading = signal(false);

  ngOnInit(): void {
    this.fetchLinks();
  }

  private fetchLinks(): void {
    this.svc.getAll().subscribe({
      next: (data) => this.links.set(data),
    });
  }

  submit(): void {
    const raw = this.urlInput.trim();
    this.error.set('');
    this.lastLink.set(null);

    try {
      const parsed = new URL(raw);
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        this.error.set('URL must use http or https.');
        return;
      }
    } catch {
      this.error.set('Please enter a valid URL (e.g. https://example.com).');
      return;
    }

    this.loading.set(true);
    this.svc.shorten(raw).subscribe({
      next: (link) => {
        this.lastLink.set(link);
        this.urlInput = '';
        this.loading.set(false);
        this.fetchLinks();
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(err.error?.error ?? 'Request failed. Is the backend running?');
        this.loading.set(false);
      },
    });
  }
}
